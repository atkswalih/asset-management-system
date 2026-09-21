from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from assets.models import (
    UserProfile,
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
)


class Command(BaseCommand):
    help = "Create sample data for the asset management system"

    def handle(self, *args, **kwargs):

        self.stdout.write("Creating sample data...")

        # -------------------------
        # USERS
        # -------------------------

        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "first_name": "System",
                "last_name": "Admin",
                "email": "admin@assetmanager.com",
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            admin.set_password("Admin@123")
            admin.save()

        UserProfile.objects.update_or_create(
            user=admin,
            defaults={
                "role": "ADMIN",
                "department": "IT",
                "phone": "9876543210",
            },
        )

        employees_data = [
            {
                "username": "arjun",
                "first_name": "Arjun",
                "last_name": "Menon",
                "email": "arjun@assetmanager.com",
                "department": "Development",
                "phone": "9876543211",
            },
            {
                "username": "rahul",
                "first_name": "Rahul",
                "last_name": "Nair",
                "email": "rahul@assetmanager.com",
                "department": "Design",
                "phone": "9876543212",
            },
            {
                "username": "meera",
                "first_name": "Meera",
                "last_name": "Thomas",
                "email": "meera@assetmanager.com",
                "department": "HR",
                "phone": "9876543213",
            },
            {
                "username": "fahad",
                "first_name": "Fahad",
                "last_name": "Ali",
                "email": "fahad@assetmanager.com",
                "department": "Finance",
                "phone": "9876543214",
            },
        ]

        employees = []

        for data in employees_data:

            employee, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "email": data["email"],
                },
            )

            if created:
                employee.set_password("Employee@123")
                employee.save()

            UserProfile.objects.update_or_create(
                user=employee,
                defaults={
                    "role": "EMPLOYEE",
                    "department": data["department"],
                    "phone": data["phone"],
                },
            )

            employees.append(employee)

        # -------------------------
        # ASSETS
        # -------------------------

        assets_data = [
            {
                "name": "Dell Latitude 5440",
                "type": "Laptop",
                "serial_number": "DL5440-001",
                "status": "ASSIGNED",
                "purchase_date": date(2025, 1, 15),
            },
            {
                "name": "HP ProBook 450",
                "type": "Laptop",
                "serial_number": "HP450-002",
                "status": "AVAILABLE",
                "purchase_date": date(2025, 2, 10),
            },
            {
                "name": "MacBook Air M3",
                "type": "Laptop",
                "serial_number": "MBA-M3-003",
                "status": "ASSIGNED",
                "purchase_date": date(2025, 3, 5),
            },
            {
                "name": "Dell UltraSharp 27",
                "type": "Monitor",
                "serial_number": "DU27-004",
                "status": "AVAILABLE",
                "purchase_date": date(2025, 4, 12),
            },
            {
                "name": "Logitech MX Keys",
                "type": "Keyboard",
                "serial_number": "LMXK-005",
                "status": "ASSIGNED",
                "purchase_date": date(2025, 5, 20),
            },
            {
                "name": "Logitech MX Master 3S",
                "type": "Mouse",
                "serial_number": "LMM-006",
                "status": "REPAIR",
                "purchase_date": date(2025, 6, 2),
            },
            {
                "name": "HP LaserJet Pro",
                "type": "Printer",
                "serial_number": "HPLJ-007",
                "status": "AVAILABLE",
                "purchase_date": date(2025, 6, 18),
            },
            {
                "name": "Lenovo ThinkPad E14",
                "type": "Laptop",
                "serial_number": "LTE14-008",
                "status": "RETIRED",
                "purchase_date": date(2024, 7, 8),
            },
        ]

        asset_objects = []

        for data in assets_data:

            asset, created = Asset.objects.get_or_create(
                serial_number=data["serial_number"],
                defaults=data,
            )

            asset_objects.append(asset)

        # -------------------------
        # INVENTORY
        # -------------------------

        inventory_data = [
            {
                "item_type": "HDMI Cable",
                "quantity": 18,
                "threshold": 5,
            },
            {
                "item_type": "USB-C Cable",
                "quantity": 12,
                "threshold": 5,
            },
            {
                "item_type": "Laptop Charger",
                "quantity": 4,
                "threshold": 5,
            },
            {
                "item_type": "Wireless Mouse",
                "quantity": 15,
                "threshold": 5,
            },
            {
                "item_type": "Keyboard",
                "quantity": 3,
                "threshold": 5,
            },
            {
                "item_type": "Ethernet Cable",
                "quantity": 25,
                "threshold": 10,
            },
        ]

        for data in inventory_data:

            InventoryItem.objects.update_or_create(
                item_type=data["item_type"],
                defaults={
                    "quantity": data["quantity"],
                    "threshold": data["threshold"],
                },
            )

        # -------------------------
        # ASSIGNMENTS
        # -------------------------

        assignments = [
            {
                "asset": asset_objects[0],
                "employee": employees[0],
                "date_assigned": date(2025, 2, 1),
            },
            {
                "asset": asset_objects[2],
                "employee": employees[1],
                "date_assigned": date(2025, 3, 10),
            },
            {
                "asset": asset_objects[4],
                "employee": employees[2],
                "date_assigned": date(2025, 5, 25),
            },
        ]

        for data in assignments:

            Assignment.objects.get_or_create(
                asset=data["asset"],
                employee=data["employee"],
                defaults={
                    "date_assigned": data["date_assigned"],
                },
            )

        # -------------------------
        # REPAIR TICKETS
        # -------------------------

        RepairTicket.objects.get_or_create(
            asset=asset_objects[5],
            issue="Mouse is disconnecting randomly.",
            defaults={
                "status": "IN_PROGRESS",
                "assigned_technician": admin,
            },
        )

        RepairTicket.objects.get_or_create(
            asset=asset_objects[1],
            issue="Laptop battery drains unusually fast.",
            defaults={
                "status": "OPEN",
                "assigned_technician": admin,
            },
        )

        RepairTicket.objects.get_or_create(
            asset=asset_objects[3],
            issue="Monitor occasionally flickers.",
            defaults={
                "status": "RESOLVED",
                "assigned_technician": admin,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Sample data created successfully."
            )
        )

        self.stdout.write("")
        self.stdout.write("Admin login:")
        self.stdout.write("Username: admin")
        self.stdout.write("Password: Admin@123")
        self.stdout.write("")
        self.stdout.write("Employee login password: Employee@123")