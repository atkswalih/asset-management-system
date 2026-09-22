from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse




from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from assets.views import CurrentUserView


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/",
        include("assets.urls"),
    ),

    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    
    path("api/health/", health_check),

    path(
        "api/auth/me/",
        CurrentUserView.as_view(),
        name="current_user",
    ),
]