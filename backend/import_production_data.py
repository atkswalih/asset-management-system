import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from assets.models import Asset

User = get_user_model()

if Asset.objects.count() == 0:
    print("Production database is empty. Importing local data...")

    User.objects.all().delete()

    call_command("loaddata", "/app/production_data.json")

    print("Production data imported successfully.")
else:
    print("Production data already exists. Skipping import.")
