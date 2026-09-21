from django.contrib import admin

from .models import (
    UserProfile,
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
    ImpersonationLog,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "role",
        "department",
        "phone",
    )

    list_filter = (
        "role",
        "department",
    )

    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "department",
        "phone",
    )

    ordering = (
        "user__username",
    )


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "type",
        "serial_number",
        "status",
        "purchase_date",
    )

    list_filter = (
        "status",
        "type",
    )

    search_fields = (
        "name",
        "serial_number",
        "type",
    )

    ordering = (
        "-purchase_date",
    )


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_type",
        "quantity",
        "threshold",
        "is_low_stock",
    )

    list_filter = (
        "item_type",
    )

    search_fields = (
        "item_type",
    )

    ordering = (
        "item_type",
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "asset",
        "employee",
        "date_assigned",
        "date_returned",
    )

    list_filter = (
        "date_assigned",
        "date_returned",
    )

    search_fields = (
        "asset__name",
        "asset__serial_number",
        "employee__username",
        "employee__first_name",
        "employee__last_name",
    )

    ordering = (
        "-date_assigned",
    )


@admin.register(RepairTicket)
class RepairTicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "asset",
        "status",
        "assigned_technician",
        "created_at",
    )

    list_filter = (
        "status",
        "assigned_technician",
    )

    search_fields = (
        "asset__name",
        "asset__serial_number",
        "issue",
        "assigned_technician__username",
    )

    ordering = (
        "-created_at",
    )


@admin.register(ImpersonationLog)
class ImpersonationLogAdmin(admin.ModelAdmin):
    list_display = (
        "admin",
        "employee",
        "started_at",
        "ended_at",
    )

    list_filter = (
        "started_at",
        "ended_at",
    )

    search_fields = (
        "admin__username",
        "employee__username",
    )

    ordering = (
        "-started_at",
    )