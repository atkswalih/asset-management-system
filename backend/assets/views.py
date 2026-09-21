from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)

from rest_framework import permissions, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .ai import ask_gemini

from .models import (
    UserProfile,
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
    ImpersonationLog,
    AIConversation,
    AIMessage,
)

from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    AdminUserSerializer,
    AssetSerializer,
    InventoryItemSerializer,
    AssignmentSerializer,
    RepairTicketSerializer,
    AIConversationSerializer,
)


class IsAdminOrReadOnly(
    permissions.BasePermission
):
    def has_permission(
        self,
        request,
        view,
    ):
        if (
            not request.user
            or not request.user.is_authenticated
        ):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_staff


class AdminOnlyPermission(
    permissions.BasePermission
):
    def has_permission(
        self,
        request,
        view,
    ):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class CurrentUserView(APIView):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_profile(self, user):
        profile, created = (
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    "role": (
                        "ADMIN"
                        if user.is_staff
                        else "EMPLOYEE"
                    )
                },
            )
        )

        return profile

    def get_user_data(self, user):
        profile = self.get_profile(user)

        return {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": (
                user.get_full_name()
                or user.username
            ),
            "email": user.email,
            "role": profile.role,
            "department": profile.department,
            "phone": profile.phone,
            "about": profile.about,
        }

    def get(self, request):
        return Response(
            self.get_user_data(
                request.user
            )
        )

    def patch(self, request):
        user = request.user
        profile = self.get_profile(user)

        allowed_user_fields = [
            "first_name",
            "last_name",
            "email",
        ]

        for field in allowed_user_fields:
            if field in request.data:
                setattr(
                    user,
                    field,
                    request.data[field],
                )

        password = request.data.get(
            "password"
        )

        if password:
            if len(password) < 8:
                return Response(
                    {
                        "detail": (
                            "Password must be at "
                            "least 8 characters."
                        )
                    },
                    status=400,
                )

            user.set_password(password)

        allowed_profile_fields = [
            "department",
            "phone",
            "about",
        ]

        for field in allowed_profile_fields:
            if field in request.data:
                setattr(
                    profile,
                    field,
                    request.data[field],
                )

        user.save()
        profile.save()

        return Response(
            self.get_user_data(user)
        )


class ImpersonateUserView(APIView):
    permission_classes = [
        AdminOnlyPermission
    ]

    def post(self, request, user_id):
        try:
            employee = User.objects.get(
                id=user_id
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "User not found."
                },
                status=404,
            )

        if employee.id == request.user.id:
            return Response(
                {
                    "detail": (
                        "You cannot impersonate "
                        "your own account."
                    )
                },
                status=400,
            )

        if not employee.is_active:
            return Response(
                {
                    "detail": (
                        "This user's account "
                        "is inactive."
                    )
                },
                status=400,
            )

        if employee.is_staff:
            return Response(
                {
                    "detail": (
                        "Administrator accounts "
                        "cannot be impersonated."
                    )
                },
                status=403,
            )

        log = ImpersonationLog.objects.create(
            admin=request.user,
            employee=employee,
        )

        refresh = RefreshToken.for_user(
            employee
        )

        access_token = refresh.access_token

        access_token[
            "impersonated_by"
        ] = request.user.id

        access_token[
            "impersonation_log_id"
        ] = log.id

        access_token.set_exp(
            from_time=timezone.now(),
            lifetime=timedelta(minutes=15),
        )

        profile, created = (
            UserProfile.objects.get_or_create(
                user=employee,
                defaults={
                    "role": "EMPLOYEE"
                },
            )
        )

        return Response(
            {
                "access": str(
                    access_token
                ),
                "refresh": str(
                    refresh
                ),
                "user": {
                    "id": employee.id,
                    "username": employee.username,
                    "full_name": (
                        employee.get_full_name()
                        or employee.username
                    ),
                    "role": profile.role,
                    "department": profile.department,
                },
                "log_id": log.id,
                "expires_in": 900,
            }
        )


class EndImpersonationView(APIView):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(self, request):
        token = request.auth

        if not token:
            return Response(
                {
                    "detail": (
                        "No authentication token."
                    )
                },
                status=400,
            )

        impersonation_log_id = token.get(
            "impersonation_log_id"
        )

        if not impersonation_log_id:
            return Response(
                {
                    "detail": (
                        "This is not an "
                        "impersonation session."
                    )
                },
                status=400,
            )

        try:
            log = ImpersonationLog.objects.get(
                id=impersonation_log_id
            )
        except ImpersonationLog.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Impersonation log not found."
                    )
                },
                status=404,
            )

        if log.ended_at is None:
            log.ended_at = timezone.now()

            log.save(
                update_fields=[
                    "ended_at"
                ]
            )

        return Response(
            {
                "detail": (
                    "Impersonation session ended."
                )
            }
        )


class AdminUserViewSet(
    viewsets.ModelViewSet
):
    queryset = User.objects.all().order_by(
        "username"
    )

    serializer_class = AdminUserSerializer

    permission_classes = [
        AdminOnlyPermission
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(
                    username__icontains=search
                )
                | Q(
                    first_name__icontains=search
                )
                | Q(
                    last_name__icontains=search
                )
                | Q(
                    email__icontains=search
                )
            )

        return queryset


class UserViewSet(
    viewsets.ReadOnlyModelViewSet
):
    queryset = User.objects.filter(
        is_active=True
    ).order_by("username")

    serializer_class = UserSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(
                    username__icontains=search
                )
                | Q(
                    first_name__icontains=search
                )
                | Q(
                    last_name__icontains=search
                )
                | Q(
                    email__icontains=search
                )
            )

        return queryset


class UserProfileViewSet(
    viewsets.ModelViewSet
):
    queryset = UserProfile.objects.select_related(
        "user"
    ).all()

    serializer_class = UserProfileSerializer

    permission_classes = [
        IsAdminOrReadOnly
    ]


class AssetViewSet(
    viewsets.ModelViewSet
):
    queryset = Asset.objects.all().order_by(
        "-created_at"
    )

    serializer_class = AssetSerializer

    permission_classes = [
        IsAdminOrReadOnly
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        asset_status = (
            self.request.query_params.get(
                "status"
            )
        )

        asset_type = (
            self.request.query_params.get(
                "type"
            )
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(
                    serial_number__icontains=search
                )
                | Q(
                    type__icontains=search
                )
            )

        if asset_status:
            queryset = queryset.filter(
                status=asset_status
            )

        if asset_type:
            queryset = queryset.filter(
                type__icontains=asset_type
            )

        return queryset


class InventoryItemViewSet(
    viewsets.ModelViewSet
):
    queryset = InventoryItem.objects.all().order_by(
        "item_type"
    )

    serializer_class = InventoryItemSerializer

    permission_classes = [
        IsAdminOrReadOnly
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        low_stock = (
            self.request.query_params.get(
                "low_stock"
            )
        )

        if search:
            queryset = queryset.filter(
                item_type__icontains=search
            )

        if low_stock == "true":
            queryset = queryset.filter(
                quantity__lte=F("threshold")
            )

        return queryset


class AssignmentViewSet(
    viewsets.ModelViewSet
):
    queryset = Assignment.objects.select_related(
        "asset",
        "employee",
    ).all().order_by(
        "-date_assigned"
    )

    serializer_class = AssignmentSerializer

    permission_classes = [
        IsAdminOrReadOnly
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(
                    asset__name__icontains=search
                )
                | Q(
                    asset__serial_number__icontains=search
                )
                | Q(
                    employee__username__icontains=search
                )
                | Q(
                    employee__first_name__icontains=search
                )
                | Q(
                    employee__last_name__icontains=search
                )
            )

        return queryset


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get(
            "current_password",
            "",
        )

        new_password = request.data.get(
            "new_password",
            "",
        )

        confirm_password = request.data.get(
            "confirm_password",
            "",
        )

        if not current_password:
            return Response(
                {
                    "detail": (
                        "Current password is required."
                    )
                },
                status=400,
            )

        if not new_password:
            return Response(
                {
                    "detail": (
                        "New password is required."
                    )
                },
                status=400,
            )

        if len(new_password) < 8:
            return Response(
                {
                    "detail": (
                        "New password must be at "
                        "least 8 characters."
                    )
                },
                status=400,
            )

        if new_password != confirm_password:
            return Response(
                {
                    "detail": (
                        "New passwords do not match."
                    )
                },
                status=400,
            )

        if not request.user.check_password(
            current_password
        ):
            return Response(
                {
                    "detail": (
                        "Current password is incorrect."
                    )
                },
                status=400,
            )

        if current_password == new_password:
            return Response(
                {
                    "detail": (
                        "New password must be different "
                        "from the current password."
                    )
                },
                status=400,
            )

        request.user.set_password(
            new_password
        )

        request.user.save()

        return Response(
            {
                "detail": (
                    "Password changed successfully."
                )
            },
            status=200,
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get(
            "email",
            "",
        ).strip()

        if not email:
            return Response(
                {
                    "detail": "Email is required."
                },
                status=400,
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        if user:
            uid = urlsafe_base64_encode(
                force_bytes(user.pk)
            )

            token = (
                default_token_generator.make_token(
                    user
                )
            )

            reset_url = (
                "http://localhost:5173/reset-password/"
                f"{uid}/{token}/"
            )

            send_mail(
                subject=(
                    "Asset Management - Password Reset"
                ),
                message=(
                    "Hello,\n\n"
                    "We received a request to reset "
                    "your password.\n\n"
                    f"Reset your password here:\n"
                    f"{reset_url}\n\n"
                    "If you did not request this, "
                    "you can ignore this email."
                ),
                from_email=(
                    "noreply@assetmanagement.local"
                ),
                recipient_list=[
                    user.email
                ],
                fail_silently=True,
            )

        return Response(
            {
                "detail": (
                    "If an account exists with "
                    "that email, a password reset "
                    "link has been sent."
                )
            },
            status=200,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get(
            "uid",
            "",
        )

        token = request.data.get(
            "token",
            "",
        )

        new_password = request.data.get(
            "new_password",
            "",
        )

        confirm_password = request.data.get(
            "confirm_password",
            "",
        )

        if not uid or not token:
            return Response(
                {
                    "detail": (
                        "Invalid password reset link."
                    )
                },
                status=400,
            )

        if len(new_password) < 8:
            return Response(
                {
                    "detail": (
                        "Password must be at least "
                        "8 characters."
                    )
                },
                status=400,
            )

        if new_password != confirm_password:
            return Response(
                {
                    "detail": (
                        "Passwords do not match."
                    )
                },
                status=400,
            )

        try:
            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id,
                is_active=True,
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {
                    "detail": (
                        "Invalid password reset link."
                    )
                },
                status=400,
            )

        if not default_token_generator.check_token(
            user,
            token,
        ):
            return Response(
                {
                    "detail": (
                        "This password reset link "
                        "is invalid or has expired."
                    )
                },
                status=400,
            )

        user.set_password(new_password)

        user.save()

        return Response(
            {
                "detail": (
                    "Password reset successfully."
                )
            },
            status=200,
        )


class RepairTicketViewSet(
    viewsets.ModelViewSet
):
    queryset = RepairTicket.objects.select_related(
        "asset",
        "assigned_technician",
    ).all().order_by(
        "-created_at"
    )

    serializer_class = RepairTicketSerializer

    permission_classes = [
        IsAdminOrReadOnly
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get(
            "search"
        )

        ticket_status = (
            self.request.query_params.get(
                "status"
            )
        )

        if search:
            queryset = queryset.filter(
                Q(
                    asset__name__icontains=search
                )
                | Q(
                    asset__serial_number__icontains=search
                )
                | Q(
                    issue__icontains=search
                )
                | Q(
                    assigned_technician__username__icontains=search
                )
            )

        if ticket_status:
            queryset = queryset.filter(
                status=ticket_status
            )

        return queryset


# =========================================
# DASHBOARD
# =========================================


class DashboardView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):
        assets = Asset.objects.all()
        inventory = InventoryItem.objects.all()
        assignments = Assignment.objects.all()
        tickets = RepairTicket.objects.all()

        return Response(
            {
                "assets": assets.count(),
                "inventory": inventory.count(),
                "assignments": assignments.count(),
                "tickets": tickets.count(),
                "asset_status": {
                    "AVAILABLE": assets.filter(
                        status="AVAILABLE"
                    ).count(),
                    "ASSIGNED": assets.filter(
                        status="ASSIGNED"
                    ).count(),
                    "REPAIR": assets.filter(
                        status="REPAIR"
                    ).count(),
                    "RETIRED": assets.filter(
                        status="RETIRED"
                    ).count(),
                },
                "ticket_status": {
                    "OPEN": tickets.filter(
                        status="OPEN"
                    ).count(),
                    "IN_PROGRESS": tickets.filter(
                        status="IN_PROGRESS"
                    ).count(),
                    "RESOLVED": tickets.filter(
                        status="RESOLVED"
                    ).count(),
                    "CLOSED": tickets.filter(
                        status="CLOSED"
                    ).count(),
                },
            }
        )


# =========================================
# AI CONVERSATIONS
# =========================================


class AIConversationListView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):
        conversations = (
            AIConversation.objects
            .filter(
                user=request.user
            )
            .order_by(
                "-updated_at"
            )
        )

        serializer = AIConversationSerializer(
            conversations,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        title = str(
            request.data.get(
                "title",
                "New conversation",
            )
        ).strip()

        if not title:
            title = "New conversation"

        conversation = (
            AIConversation.objects.create(
                user=request.user,
                title=title[:200],
            )
        )

        serializer = AIConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class AIConversationDetailView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def get_conversation(
        self,
        request,
        conversation_id,
    ):
        return get_object_or_404(
            AIConversation,
            id=conversation_id,
            user=request.user,
        )

    def get(
        self,
        request,
        conversation_id,
    ):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        serializer = AIConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        conversation_id,
    ):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        title = str(
            request.data.get(
                "title",
                "",
            )
        ).strip()

        if not title:
            return Response(
                {
                    "detail": (
                        "Conversation name "
                        "cannot be empty."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation.title = title[:200]

        conversation.save(
            update_fields=[
                "title",
                "updated_at",
            ]
        )

        serializer = AIConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def delete(
        self,
        request,
        conversation_id,
    ):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        conversation.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )


class AIChatView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):
        conversation_id = request.data.get(
            "conversation_id"
        )

        question = str(
            request.data.get(
                "message",
                "",
            )
        ).strip()

        edit_message_id = request.data.get(
            "edit_message_id"
        )

        if not conversation_id:
            return Response(
                {
                    "detail": (
                        "conversation_id is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not question:
            return Response(
                {
                    "detail": (
                        "Please enter a message."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(question) > 2000:
            return Response(
                {
                    "detail": (
                        "Message is too long. "
                        "Please keep it under "
                        "2000 characters."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = get_object_or_404(
            AIConversation,
            id=conversation_id,
            user=request.user,
        )

        if not edit_message_id:

            user_message = (
                AIMessage.objects.create(
                    conversation=conversation,
                    role="user",
                    content=question,
                )
            )

            user_message_count = (
                AIMessage.objects
                .filter(
                    conversation=conversation,
                    role="user",
                )
                .count()
            )

            if (
                user_message_count == 1
                and conversation.title
                == "New conversation"
            ):
                conversation.title = (
                    self.generate_title(
                        question
                    )
                )

            conversation.updated_at = (
                timezone.now()
            )

            conversation.save(
                update_fields=[
                    "title",
                    "updated_at",
                ]
            )

            try:
                answer = ask_gemini(
                    question,
                    conversation=conversation,
                )

            except Exception as error:
                print(
                    "AI ERROR:",
                    repr(error),
                )

                answer = (
                    "I can help you with the "
                    "asset management data. "
                    "You can ask about assets, "
                    "inventory, assignments, "
                    "users, or repair tickets."
                )

            assistant_message = (
                AIMessage.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=answer,
                )
            )

            conversation.updated_at = (
                timezone.now()
            )

            conversation.save(
                update_fields=[
                    "updated_at"
                ]
            )

            return Response(
                {
                    "message": {
                        "id": assistant_message.id,
                        "role": "assistant",
                        "content": answer,
                        "created_at": (
                            assistant_message
                            .created_at
                        ),
                    },
                    "conversation_id": (
                        conversation.id
                    ),
                    "conversation_title": (
                        conversation.title
                    ),
                    "user_message_id": (
                        user_message.id
                    ),
                },
                status=status.HTTP_200_OK,
            )

        edited_message = get_object_or_404(
            AIMessage,
            id=edit_message_id,
            conversation=conversation,
            role="user",
        )

        try:
            with transaction.atomic():

                edited_message.content = question

                edited_message.save(
                    update_fields=[
                        "content"
                    ]
                )

                AIMessage.objects.filter(
                    conversation=conversation,
                    created_at__gt=(
                        edited_message.created_at
                    ),
                ).delete()

                conversation.updated_at = (
                    timezone.now()
                )

                conversation.save(
                    update_fields=[
                        "updated_at"
                    ]
                )

                try:
                    answer = ask_gemini(
                        question,
                        conversation=conversation,
                    )

                except Exception as error:
                    print(
                        "AI EDIT ERROR:",
                        repr(error),
                    )

                    answer = (
                        "I can still access your "
                        "asset management data. "
                        "Please ask about assets, "
                        "inventory, assignments, "
                        "users, or repair tickets."
                    )

                assistant_message = (
                    AIMessage.objects.create(
                        conversation=conversation,
                        role="assistant",
                        content=answer,
                    )
                )

                conversation.updated_at = (
                    timezone.now()
                )

                conversation.save(
                    update_fields=[
                        "updated_at"
                    ]
                )

        except Exception as error:
            print(
                "AI EDIT DATABASE ERROR:",
                repr(error),
            )

            return Response(
                {
                    "detail": (
                        "The message could not be "
                        "updated. Please try again."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": {
                    "id": assistant_message.id,
                    "role": "assistant",
                    "content": answer,
                    "created_at": (
                        assistant_message
                        .created_at
                    ),
                },
                "conversation_id": (
                    conversation.id
                ),
                "conversation_title": (
                    conversation.title
                ),
                "user_message_id": (
                    edited_message.id
                ),
                "edited": True,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def generate_title(question):
        text = " ".join(
            question.strip().split()
        )

        if not text:
            return "New conversation"

        replacements = {
            "how many": "Count",
            "what is": "Information",
            "what are": "Information",
            "show me": "Overview",
            "which": "Items",
            "who": "People",
            "where": "Location",
            "why": "Explanation",
            "when": "Timeline",
        }

        lower_text = text.lower()

        for phrase, replacement in (
            replacements.items()
        ):
            if lower_text.startswith(
                phrase
            ):
                text = (
                    replacement
                    + text[len(phrase):]
                )
                break

        words = text.split()

        if len(words) > 7:
            text = (
                " ".join(words[:7])
                + "..."
            )

        if len(text) > 55:
            text = (
                text[:55].rstrip()
                + "..."
            )

        return text