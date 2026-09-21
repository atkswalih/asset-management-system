from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from assets.models import (
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
    UserProfile,
)


class AssetManagementAPITests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username="testadmin",
            password="Admin@123",
            email="admin@test.com",
            first_name="Test",
            last_name="Admin",
            is_staff=True,
            is_superuser=True,
        )

        UserProfile.objects.create(
            user=cls.admin,
            role="ADMIN",
            department="IT",
        )

        cls.employee = User.objects.create_user(
            username="testemployee",
            password="Employee@123",
            email="employee@test.com",
            first_name="Test",
            last_name="Employee",
        )

        UserProfile.objects.create(
            user=cls.employee,
            role="EMPLOYEE",
            department="IT",
        )

        cls.asset = Asset.objects.create(
            name="Test Laptop",
            type="Laptop",
            serial_number="TEST-001",
            status="AVAILABLE",
            purchase_date=date.today(),
        )

        cls.inventory = InventoryItem.objects.create(
            item_type="Mouse",
            quantity=10,
            threshold=5,
        )

    def login(self, username, password):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": username,
                "password": password,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

        return response

    # -------------------------
    # AUTHENTICATION
    # -------------------------

    def test_admin_login(self):
        self.login("testadmin", "Admin@123")

    def test_employee_login(self):
        self.login("testemployee", "Employee@123")

    def test_current_user(self):
        self.login("testemployee", "Employee@123")

        response = self.client.get(
            "/api/auth/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["username"],
            "testemployee",
        )

    # -------------------------
    # ASSETS
    # -------------------------

    def test_assets_list(self):
        self.login("testemployee", "Employee@123")

        response = self.client.get(
            "/api/assets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_admin_can_create_asset(self):
        self.login("testadmin", "Admin@123")

        response = self.client.post(
            "/api/assets/",
            {
                "name": "Test Monitor",
                "type": "Monitor",
                "serial_number": "TEST-002",
                "status": "AVAILABLE",
                "purchase_date": str(date.today()),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_employee_cannot_create_asset(self):
        self.login("testemployee", "Employee@123")

        response = self.client.post(
            "/api/assets/",
            {
                "name": "Employee Monitor",
                "type": "Monitor",
                "serial_number": "TEST-003",
                "status": "AVAILABLE",
                "purchase_date": str(date.today()),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # -------------------------
    # INVENTORY
    # -------------------------

    def test_inventory_list(self):
        self.login("testemployee", "Employee@123")

        response = self.client.get(
            "/api/inventory/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_admin_can_create_inventory(self):
        self.login("testadmin", "Admin@123")

        response = self.client.post(
            "/api/inventory/",
            {
                "item_type": "Keyboard",
                "quantity": 20,
                "threshold": 5,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    # -------------------------
    # ASSIGNMENTS
    # -------------------------

    def test_assignment_creation(self):
        self.login("testadmin", "Admin@123")

        response = self.client.post(
            "/api/assignments/",
            {
                "asset": self.asset.id,
                "employee": self.employee.id,
                "date_assigned": str(date.today()),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    # -------------------------
    # REPAIR TICKETS
    # -------------------------

    def test_ticket_creation(self):
        self.login("testadmin", "Admin@123")

        response = self.client.post(
            "/api/tickets/",
            {
                "asset": self.asset.id,
                "issue": "Screen is not working",
                "status": "OPEN",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_ticket_list(self):
        self.login("testemployee", "Employee@123")

        response = self.client.get(
            "/api/tickets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    # -------------------------
    # USER MANAGEMENT
    # -------------------------

    def test_admin_can_view_users(self):
        self.login("testadmin", "Admin@123")

        response = self.client.get(
            "/api/admin/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_employee_cannot_manage_users(self):
        self.login("testemployee", "Employee@123")

        response = self.client.get(
            "/api/admin/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # -------------------------
    # PROFILE UPDATE
    # -------------------------

    def test_employee_can_update_profile(self):
        self.login("testemployee", "Employee@123")

        response = self.client.patch(
            "/api/auth/me/",
            {
                "first_name": "Updated",
                "department": "Engineering",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.employee.refresh_from_db()

        self.assertEqual(
            self.employee.first_name,
            "Updated",
        )

        self.assertEqual(
            self.employee.profile.department,
            "Engineering",
        )

    # -------------------------
    # PASSWORD CHANGE
    # -------------------------

    def test_employee_can_change_password(self):
        self.login("testemployee", "Employee@123")

        response = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "Employee@123",
                "new_password": "NewPassword@123",
                "confirm_password": "NewPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.employee.refresh_from_db()

        self.assertTrue(
            self.employee.check_password(
                "NewPassword@123"
            )
        )

    # -------------------------
    # UNAUTHENTICATED ACCESS
    # -------------------------

    def test_unauthenticated_assets(self):
        self.client.credentials()

        response = self.client.get(
            "/api/assets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )