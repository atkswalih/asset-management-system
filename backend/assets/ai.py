import os
import re
import time

from django.contrib.auth.models import User
from google import genai
from google.genai import types

from .models import (
    UserProfile,
    Asset,
    InventoryItem,
    Assignment,
    RepairTicket,
)


# =========================================
# GEMINI MODELS
# =========================================

PRIMARY_MODEL = "gemini-3.5-flash-lite"

FALLBACK_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
]

MAX_HISTORY_MESSAGES = 12


# =========================================
# CLIENT
# =========================================

def get_ai_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            timeout=10000,
        ),
    )


# =========================================
# DATABASE DATA
# =========================================

def get_asset_data():
    assets = Asset.objects.all().order_by("name")

    return [
        {
            "id": asset.id,
            "name": asset.name,
            "type": asset.type,
            "serial_number": asset.serial_number,
            "status": asset.status,
            "purchase_date": str(asset.purchase_date),
        }
        for asset in assets
    ]


def get_inventory_data():
    inventory = (
        InventoryItem.objects
        .all()
        .order_by("item_type")
    )

    return [
        {
            "id": item.id,
            "item_type": item.item_type,
            "quantity": item.quantity,
            "threshold": item.threshold,
            "low_stock": item.is_low_stock,
        }
        for item in inventory
    ]


def get_assignment_data():
    assignments = (
        Assignment.objects
        .select_related(
            "asset",
            "employee",
        )
        .all()
        .order_by("-date_assigned")
    )

    return [
        {
            "id": assignment.id,
            "asset": assignment.asset.name,
            "employee": (
                assignment.employee.get_full_name()
                or assignment.employee.username
            ),
            "date_assigned": str(
                assignment.date_assigned
            ),
            "date_returned": (
                str(assignment.date_returned)
                if assignment.date_returned
                else None
            ),
        }
        for assignment in assignments
    ]


def get_ticket_data():
    tickets = (
        RepairTicket.objects
        .select_related(
            "asset",
            "assigned_technician",
        )
        .all()
        .order_by("-created_at")
    )

    return [
        {
            "id": ticket.id,
            "asset": ticket.asset.name,
            "issue": ticket.issue,
            "status": ticket.status,
            "technician": (
                (
                    ticket.assigned_technician
                    .get_full_name()
                    or ticket.assigned_technician.username
                )
                if ticket.assigned_technician
                else None
            ),
        }
        for ticket in tickets
    ]


def get_user_data():
    users = (
        User.objects
        .filter(is_active=True)
        .select_related("profile")
    )

    result = []

    for user in users:
        try:
            profile = user.profile
            role = profile.role
            department = profile.department

        except UserProfile.DoesNotExist:
            role = (
                "ADMIN"
                if user.is_staff
                else "EMPLOYEE"
            )
            department = ""

        result.append(
            {
                "id": user.id,
                "username": user.username,
                "name": (
                    user.get_full_name()
                    or user.username
                ),
                "role": role,
                "department": department,
            }
        )

    return result


def build_context():
    return {
        "assets": get_asset_data(),
        "inventory": get_inventory_data(),
        "assignments": get_assignment_data(),
        "repair_tickets": get_ticket_data(),
        "users": get_user_data(),
    }


# =========================================
# LOCAL FALLBACK
# =========================================

def local_fallback_answer(question, context):
    """
    Emergency fallback.

    This means the assistant can still answer
    common asset-management questions even when
    Gemini is unavailable.
    """

    text = question.lower().strip()

    assets = context["assets"]
    inventory = context["inventory"]
    assignments = context["assignments"]
    tickets = context["repair_tickets"]
    users = context["users"]

    # -----------------------------------------
    # ASSET COUNTS
    # -----------------------------------------

    if (
        re.search(r"\bhow many\b", text)
        and "asset" in text
    ):
        total = len(assets)

        if "available" in text:
            count = sum(
                1
                for asset in assets
                if asset["status"] == "AVAILABLE"
            )

            return (
                f"There are **{count} available assets**."
            )

        if "assigned" in text:
            count = sum(
                1
                for asset in assets
                if asset["status"] == "ASSIGNED"
            )

            return (
                f"There are **{count} assigned assets**."
            )

        if (
            "repair" in text
            or "under repair" in text
        ):
            count = sum(
                1
                for asset in assets
                if asset["status"] == "REPAIR"
            )

            return (
                f"There are **{count} assets under repair**."
            )

        if "retired" in text:
            count = sum(
                1
                for asset in assets
                if asset["status"] == "RETIRED"
            )

            return (
                f"There are **{count} retired assets**."
            )

        return (
            f"There are **{total} assets** in the system."
        )

    # -----------------------------------------
    # INVENTORY
    # -----------------------------------------

    if (
        "low stock" in text
        or "low-stock" in text
        or (
            "inventory" in text
            and "low" in text
        )
    ):
        low_items = [
            item
            for item in inventory
            if item["low_stock"]
        ]

        if not low_items:
            return (
                "There are currently **no low-stock inventory items**."
            )

        lines = [
            f"- **{item['item_type']}** — "
            f"{item['quantity']} remaining "
            f"(threshold: {item['threshold']})"
            for item in low_items
        ]

        return (
            "**Low-stock items:**\n\n"
            + "\n".join(lines)
        )

    if (
        re.search(r"\bhow many\b", text)
        and "inventory" in text
    ):
        total_quantity = sum(
            item["quantity"]
            for item in inventory
        )

        return (
            f"There are **{len(inventory)} inventory items** "
            f"with **{total_quantity} total units**."
        )

    # -----------------------------------------
    # TICKETS
    # -----------------------------------------

    if (
        "ticket" in text
        and (
            "how many" in text
            or "count" in text
        )
    ):
        if "open" in text:
            count = sum(
                1
                for ticket in tickets
                if ticket["status"] == "OPEN"
            )

            return (
                f"There are **{count} open repair tickets**."
            )

        if "resolved" in text:
            count = sum(
                1
                for ticket in tickets
                if ticket["status"] == "RESOLVED"
            )

            return (
                f"There are **{count} resolved repair tickets**."
            )

        return (
            f"There are **{len(tickets)} repair tickets** "
            "in the system."
        )

    # -----------------------------------------
    # ASSIGNMENTS
    # -----------------------------------------

    if (
        "assignment" in text
        and (
            "how many" in text
            or "count" in text
        )
    ):
        active = sum(
            1
            for assignment in assignments
            if not assignment["date_returned"]
        )

        return (
            f"There are **{len(assignments)} assignments** "
            f"in total, with **{active} currently active**."
        )

    # -----------------------------------------
    # USERS
    # -----------------------------------------

    if (
        (
            "how many users" in text
            or "how many employees" in text
            or "number of users" in text
        )
    ):
        return (
            f"There are **{len(users)} active users** "
            "in the system."
        )

    # -----------------------------------------
    # AVAILABLE ASSETS
    # -----------------------------------------

    if (
        "available assets" in text
        and (
            "show" in text
            or "list" in text
            or "which" in text
        )
    ):
        available = [
            asset
            for asset in assets
            if asset["status"] == "AVAILABLE"
        ]

        if not available:
            return (
                "There are currently **no available assets**."
            )

        lines = [
            f"- **{asset['name']}** "
            f"({asset['type']}) — "
            f"`{asset['serial_number']}`"
            for asset in available
        ]

        return (
            "**Available assets:**\n\n"
            + "\n".join(lines)
        )

    # -----------------------------------------
    # GENERAL FALLBACK
    # -----------------------------------------

    return (
        "I can still access the asset management "
        "data, but the AI reasoning service is "
        "temporarily unavailable.\n\n"
        "Try asking me about **assets, inventory, "
        "assignments, users, or repair tickets**."
    )


# =========================================
# GEMINI
# =========================================

def ask_gemini(
    question,
    conversation=None,
):
    context = build_context()

    # =====================================
    # FAST LOCAL ANSWERS
    # =====================================

    fast_answer = local_fallback_answer(
        question,
        context,
    )

    # Only use local answer immediately for
    # very obvious database questions.
    simple_question = any(
        phrase in question.lower()
        for phrase in [
            "how many",
            "number of",
            "count",
            "low stock",
            "available assets",
        ]
    )

    if simple_question:
        return fast_answer

    # =====================================
    # GEMINI CLIENT
    # =====================================

    client = get_ai_client()

    if client is None:
        return local_fallback_answer(
            question,
            context,
        )

    conversation_history = []

    if conversation:
        history = list(
            conversation.messages
            .order_by(
                "created_at",
                "id",
            )
            .all()
        )

        previous_messages = history[:-1]

        previous_messages = (
            previous_messages[
                -MAX_HISTORY_MESSAGES:
            ]
        )

        for message in previous_messages:
            conversation_history.append(
                {
                    "role": message.role,
                    "content": message.content,
                }
            )

    # =====================================
    # SYSTEM INSTRUCTION
    # =====================================

    system_instruction = """
You are the AI assistant for an Asset Management System.

You can answer both general questions and questions
about the Asset Management System.

For questions about the application data, use the
provided database data as the source of truth.

Rules:

1. Never invent database information.
2. For assets, inventory, assignments, users and
   repair tickets, only use the provided application
   data.
3. If a specific database record does not exist,
   clearly say that it was not found.
4. For general knowledge questions that are unrelated
   to the application database, answer normally.
5. Keep answers concise and useful.
6. Answer directly before giving explanation.
7. Use Markdown when helpful.
8. You can calculate totals and comparisons from
   the supplied database data.
9. Never expose passwords, API keys, authentication
   tokens or other secrets.
10. Never claim that you changed database data unless
    the application actually performed that change.
11. Maintain context from the recent conversation.
12. Do not repeat the entire database for simple
    questions.
13. If a question combines general knowledge with
    application data, answer both parts using the
    appropriate source.
"""

    prompt = f"""
APPLICATION DATA:

{context}

RECENT CONVERSATION:

{conversation_history}

CURRENT USER QUESTION:

{question}
"""

    # =====================================
    # MODEL FAILOVER
    # =====================================

    models = [
        PRIMARY_MODEL,
        *FALLBACK_MODELS,
    ]

    last_error = None

    for index, model_name in enumerate(models):
        try:
            print(
                f"AI: trying {model_name}"
            )

            config_kwargs = {
                "system_instruction": (
                    system_instruction
                ),
                "max_output_tokens": 1200,
            }

            # Gemini 3 models support low thinking.
            config_kwargs["thinking_config"] = (
                types.ThinkingConfig(
                    thinking_level="minimal"
                )
            )

            response = (
                client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        **config_kwargs
                    ),
                )
            )

            answer = (
                response.text
                if response
                else None
            )

            if answer:
                print(
                    f"AI: successful response "
                    f"from {model_name}"
                )

                return answer.strip()

            raise RuntimeError(
                "Gemini returned an empty response."
            )

        except Exception as error:
            last_error = error

            print(
                f"AI ERROR from {model_name}: "
                f"{repr(error)}"
            )

            # Small backoff only for transient
            # failures before moving to fallback.
            if index < len(models) - 1:
                time.sleep(0.35)

    # =====================================
    # FINAL SAFETY NET
    # =====================================

    print(
        "AI: all Gemini models failed. "
        "Using local database fallback."
    )

    return local_fallback_answer(
        question,
        context,
    )
