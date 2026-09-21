from datetime import date

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AssetManagementAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username="testadmin",
            password="TestAdmin@123",
            first_name="Test",
            last_name="Admin",
            email="admin@test.com",
            is_staff=True,
        )

        cls.employee = User.objects.create_user(
            username="testemployee",
            password="TestEmployee@123",
            first_name="Test",
            last_name="Employee",
            email="employee@test.com",
        )

        from .models import (
            UserProfile,
            Asset,
            InventoryItem,
            Assignment,
            RepairTicket,
        )

        UserProfile.objects.create(
            user=cls.admin,
            role="ADMIN",
            department="IT",
        )

        UserProfile.objects.create(
            user=cls.employee,
            role="EMPLOYEE",
            department="Development",
        )

        cls.asset = Asset.objects.create(
            name="Test Laptop",
            type="Laptop",
            serial_number="TEST-SERIAL-001",
            status="AVAILABLE",
            purchase_date=date(2026, 1, 15),
        )

        cls.inventory = InventoryItem.objects.create(
            item_type="Test Mouse",
            quantity=20,
            threshold=5,
        )

        cls.assignment = Assignment.objects.create(
            asset=cls.asset,
            employee=cls.employee,
            date_assigned=date(2026, 2, 1),
        )

        cls.ticket = RepairTicket.objects.create(
            asset=cls.asset,
            issue="Test repair issue",
            status="OPEN",
            assigned_technician=cls.admin,
        )

    def login_admin(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testadmin",
                "password": "TestAdmin@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {response.data['access']}"
            )
        )

        return response

    def login_employee(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testemployee",
                "password": "TestEmployee@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {response.data['access']}"
            )
        )

        return response

    # -------------------------
    # AUTHENTICATION
    # -------------------------

    def test_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testadmin",
                "password": "TestAdmin@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_invalid_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "testadmin",
                "password": "wrong-password",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # -------------------------
    # CURRENT USER
    # -------------------------

    def test_current_user(self):
        self.login_admin()

        response = self.client.get(
            "/api/auth/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["username"],
            "testadmin",
        )

    # -------------------------
    # DASHBOARD
    # -------------------------

    def test_dashboard(self):
        self.login_admin()

        response = self.client.get(
            "/api/dashboard/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("assets", response.data)
        self.assertIn("inventory", response.data)
        self.assertIn("assignments", response.data)
        self.assertIn("tickets", response.data)
        self.assertIn("asset_status", response.data)
        self.assertIn("ticket_status", response.data)

        self.assertEqual(
            response.data["assets"],
            1,
        )

    # -------------------------
    # ASSETS
    # -------------------------

    def test_assets_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/assets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("results", response.data)

    def test_asset_create(self):
        self.login_admin()

        response = self.client.post(
            "/api/assets/",
            {
                "name": "Test Monitor",
                "type": "Monitor",
                "serial_number": "TEST-MONITOR-001",
                "status": "AVAILABLE",
                "purchase_date": "2026-03-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["name"],
            "Test Monitor",
        )

    def test_asset_update(self):
        self.login_admin()

        response = self.client.patch(
            f"/api/assets/{self.asset.id}/",
            {
                "name": "Updated Laptop",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["name"],
            "Updated Laptop",
        )

    def test_asset_search(self):
        self.login_admin()

        response = self.client.get(
            "/api/assets/?search=Test%20Laptop"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertGreaterEqual(
            len(response.data["results"]),
            1,
        )

    def test_asset_delete(self):
        self.login_admin()

        response = self.client.delete(
            f"/api/assets/{self.asset.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

    # -------------------------
    # INVENTORY
    # -------------------------

    def test_inventory_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/inventory/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("results", response.data)

    def test_inventory_create(self):
        self.login_admin()

        response = self.client.post(
            "/api/inventory/",
            {
                "item_type": "Test Keyboard",
                "quantity": 15,
                "threshold": 5,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_inventory_low_stock(self):
        self.login_admin()

        response = self.client.post(
            "/api/inventory/",
            {
                "item_type": "Low Stock Cable",
                "quantity": 2,
                "threshold": 5,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            response.data["is_low_stock"]
        )

    # -------------------------
    # ASSIGNMENTS
    # -------------------------

    def test_assignments_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/assignments/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("results", response.data)

    def test_assignment_create(self):
        self.login_admin()

        from .models import Asset

        asset = Asset.objects.create(
            name="Assignment Laptop",
            type="Laptop",
            serial_number="ASSIGNMENT-001",
            status="AVAILABLE",
            purchase_date=date(2026, 4, 1),
        )

        response = self.client.post(
            "/api/assignments/",
            {
                "asset": asset.id,
                "employee": self.employee.id,
                "date_assigned": "2026-04-10",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    # -------------------------
    # TICKETS
    # -------------------------

    def test_tickets_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/tickets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("results", response.data)

    def test_ticket_create(self):
        self.login_admin()

        response = self.client.post(
            "/api/tickets/",
            {
                "asset": self.asset.id,
                "issue": "New test issue",
                "status": "OPEN",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_ticket_search(self):
        self.login_admin()

        response = self.client.get(
            "/api/tickets/?search=Test%20repair"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertGreaterEqual(
            len(response.data["results"]),
            1,
        )

    # -------------------------
    # USER MANAGEMENT
    # -------------------------

    def test_users_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_admin_users_list(self):
        self.login_admin()

        response = self.client.get(
            "/api/admin/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    # -------------------------
    # EMPLOYEE PERMISSIONS
    # -------------------------

    def test_employee_can_read_assets(self):
        self.login_employee()

        response = self.client.get(
            "/api/assets/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_employee_cannot_create_asset(self):
        self.login_employee()

        response = self.client.post(
            "/api/assets/",
            {
                "name": "Unauthorized Laptop",
                "type": "Laptop",
                "serial_number": "UNAUTHORIZED-001",
                "status": "AVAILABLE",
                "purchase_date": "2026-05-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_access_admin_users(self):
        self.login_employee()

        response = self.client.get(
            "/api/admin/users/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # -------------------------
    # PASSWORD CHANGE
    # -------------------------

def test_password_change(self):
    self.login_admin()

    response = self.client.post(
        "/api/auth/change-password/",
        {
            "old_password": "TestAdmin@123",
            "new_password": "NewTestAdmin@123",
        },
        format="json",
    )

    print("\nPASSWORD CHANGE RESPONSE:")
    print("STATUS:", response.status_code)
    print("DATA:", response.data)

    self.assertEqual(
        response.status_code,
        status.HTTP_200_OK,
    )

    self.admin.refresh_from_db()

    self.assertTrue(
        self.admin.check_password(
            "NewTestAdmin@123"
        )
    )