from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    UserViewSet,
    UserProfileViewSet,
    AssetViewSet,
    InventoryItemViewSet,
    AssignmentViewSet,
    RepairTicketViewSet,
    DashboardView,
    ImpersonateUserView,
    EndImpersonationView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordView,
    AIChatView,
    AIConversationListView,
    AIConversationDetailView,
)


router = DefaultRouter()

router.register(
    "admin/users",
    AdminUserViewSet,
    basename="admin-users",
)

router.register(
    "users",
    UserViewSet,
    basename="users",
)

router.register(
    "profiles",
    UserProfileViewSet,
    basename="profiles",
)

router.register(
    "assets",
    AssetViewSet,
    basename="assets",
)

router.register(
    "inventory",
    InventoryItemViewSet,
    basename="inventory",
)

router.register(
    "assignments",
    AssignmentViewSet,
    basename="assignments",
)

router.register(
    "tickets",
    RepairTicketViewSet,
    basename="tickets",
)


urlpatterns = [
    path(
        "",
        include(router.urls),
    ),

    # Dashboard
    path(
        "dashboard/",
        DashboardView.as_view(),
        name="dashboard",
    ),

    # Impersonation
    path(
        "admin/users/<int:user_id>/impersonate/",
        ImpersonateUserView.as_view(),
        name="impersonate-user",
    ),

    path(
        "auth/end-impersonation/",
        EndImpersonationView.as_view(),
        name="end-impersonation",
    ),

    # Password
    path(
        "auth/change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),

    path(
        "auth/forgot-password/",
        ForgotPasswordView.as_view(),
        name="forgot-password",
    ),

    path(
        "auth/reset-password/",
        ResetPasswordView.as_view(),
        name="reset-password",
    ),

    # AI
    path(
        "ai/conversations/",
        AIConversationListView.as_view(),
        name="ai-conversations",
    ),

    path(
        "ai/conversations/<int:conversation_id>/",
        AIConversationDetailView.as_view(),
        name="ai-conversation-detail",
    ),

    path(
        "ai/chat/",
        AIChatView.as_view(),
        name="ai-chat",
    ),
]