from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    UserProfile,
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
    AIConversation,
    AIMessage,
)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "role",
            "department",
            "phone",
            "about",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    about = serializers.SerializerMethodField()

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "department",
            "phone",
            "about",
            "is_active",
        ]

        read_only_fields = [
            "id",
            "full_name",
        ]

    def get_profile(self, obj):
        try:
            return obj.profile
        except UserProfile.DoesNotExist:
            return None

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        profile = self.get_profile(obj)

        if profile:
            return profile.role

        return "ADMIN" if obj.is_staff else "EMPLOYEE"

    def get_department(self, obj):
        profile = self.get_profile(obj)

        if profile:
            return profile.department

        return ""

    def get_phone(self, obj):
        profile = self.get_profile(obj)

        if profile:
            return profile.phone

        return ""

    def get_about(self, obj):
        profile = self.get_profile(obj)

        if profile:
            return profile.about

        return ""

    def create(self, validated_data):
        password = validated_data.pop(
            "password",
            "",
        )

        role = validated_data.pop(
            "role",
            "EMPLOYEE",
        )

        department = validated_data.pop(
            "department",
            "",
        )

        phone = validated_data.pop(
            "phone",
            "",
        )

        about = validated_data.pop(
            "about",
            "",
        )

        user = User.objects.create_user(
            password=password or "Employee@123",
            **validated_data,
        )

        user.is_staff = role == "ADMIN"
        user.save()

        UserProfile.objects.create(
            user=user,
            role=role,
            department=department,
            phone=phone,
            about=about,
        )

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop(
            "password",
            None,
        )

        role = validated_data.pop(
            "role",
            None,
        )

        department = validated_data.pop(
            "department",
            None,
        )

        phone = validated_data.pop(
            "phone",
            None,
        )

        about = validated_data.pop(
            "about",
            None,
        )

        for field, value in validated_data.items():
            setattr(
                instance,
                field,
                value,
            )

        if password:
            instance.set_password(password)

        if role is not None:
            instance.is_staff = role == "ADMIN"

        instance.save()

        profile, created = (
            UserProfile.objects.get_or_create(
                user=instance,
                defaults={
                    "role": (
                        role
                        or (
                            "ADMIN"
                            if instance.is_staff
                            else "EMPLOYEE"
                        )
                    ),
                },
            )
        )

        if role is not None:
            profile.role = role

        if department is not None:
            profile.department = department

        if phone is not None:
            profile.phone = phone

        if about is not None:
            profile.about = about

        profile.save()

        return instance


class AssetSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "type",
            "serial_number",
            "status",
            "status_display",
            "purchase_date",
            "created_at",
            "updated_at",
        ]


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(
        read_only=True
    )

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "item_type",
            "quantity",
            "threshold",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(
        source="asset.name",
        read_only=True,
    )

    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "asset",
            "asset_name",
            "employee",
            "employee_name",
            "date_assigned",
            "date_returned",
            "created_at",
        ]

    def get_employee_name(self, obj):
        return (
            obj.employee.get_full_name()
            or obj.employee.username
        )


class RepairTicketSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(
        source="asset.name",
        read_only=True,
    )

    technician_name = serializers.SerializerMethodField()

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = RepairTicket
        fields = [
            "id",
            "asset",
            "asset_name",
            "issue",
            "status",
            "status_display",
            "assigned_technician",
            "technician_name",
            "created_at",
            "updated_at",
        ]

    def get_technician_name(self, obj):
        if not obj.assigned_technician:
            return None

        return (
            obj.assigned_technician.get_full_name()
            or obj.assigned_technician.username
        )
        
class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = [
            "id",
            "role",
            "content",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = AIConversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "messages",
        ]