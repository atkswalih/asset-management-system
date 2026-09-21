from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("EMPLOYEE", "Employee"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="EMPLOYEE",
    )

    department = models.CharField(
        max_length=100,
        blank=True,
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    about = models.TextField(
        blank=True,
        default="",
    )

    def __str__(self):
        name = self.user.get_full_name()

        if name:
            return f"{name} - {self.role}"

        return f"{self.user.username} - {self.role}"


class Asset(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("ASSIGNED", "Assigned"),
        ("REPAIR", "Under Repair"),
        ("RETIRED", "Retired"),
    ]

    name = models.CharField(
        max_length=150
    )

    type = models.CharField(
        max_length=100
    )

    serial_number = models.CharField(
        max_length=100,
        unique=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="AVAILABLE",
    )

    purchase_date = models.DateField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"{self.name} - "
            f"{self.serial_number}"
        )


class InventoryItem(models.Model):
    item_type = models.CharField(
        max_length=100
    )

    quantity = models.PositiveIntegerField(
        default=0
    )

    threshold = models.PositiveIntegerField(
        default=5
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    @property
    def is_low_stock(self):
        return self.quantity <= self.threshold

    def __str__(self):
        return self.item_type


class Assignment(models.Model):
    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="asset_assignments",
    )

    date_assigned = models.DateField()

    date_returned = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.asset.name} → "
            f"{self.employee.username}"
        )


class RepairTicket(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="repair_tickets",
    )

    issue = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="OPEN",
    )

    assigned_technician = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repair_tickets",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"Ticket #{self.id} - "
            f"{self.asset.name}"
        )


class ImpersonationLog(models.Model):
    admin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="impersonation_logs",
    )

    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="impersonated_logs",
    )

    started_at = models.DateTimeField(
        auto_now_add=True
    )

    ended_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.admin.username} → "
            f"{self.employee.username}"
        )
        
        
class AIConversation(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
    )
    title = models.CharField(
        max_length=200,
        default="New conversation",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class AIMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
    )
    content = models.TextField()
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return (
            f"{self.conversation.title} - "
            f"{self.role}"
        )