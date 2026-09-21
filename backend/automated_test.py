import os
import sys

import requests


# ============================================================
# ASSET MANAGEMENT - AUTOMATED TEST
#
# Run from the backend folder:
#
#     python automated_test.py
#
# Optional:
#
#     $env:BASE_URL="http://127.0.0.1:8000"
#     $env:TEST_USERNAME="admin"
#     $env:TEST_PASSWORD="Admin@123"
# ============================================================


BASE_URL = os.getenv(
    "BASE_URL",
    "http://127.0.0.1:8000",
).rstrip("/")


AI_CHAT_URL = (
    f"{BASE_URL}/api/ai/chat/"
)


AI_CONVERSATIONS_URL = (
    f"{BASE_URL}/api/ai/conversations/"
)


ADMIN_USERNAME = os.getenv(
    "TEST_USERNAME",
    "admin",
)


ADMIN_PASSWORD = os.getenv(
    "TEST_PASSWORD",
    "Admin@123",
)


# Gemini can take longer than normal API requests.
TIMEOUT = 60


# ============================================================
# GLOBAL STATE
# ============================================================


session = requests.Session()

access_token = None
refresh_token = None
conversation_id = None

passed = 0
failed = 0
skipped = 0


# ============================================================
# OUTPUT
# ============================================================


def print_header():

    print()

    print("=" * 60)

    print(
        " ASSET MANAGEMENT AUTOMATED TEST"
    )

    print("=" * 60)

    print(
        f"Backend : {BASE_URL}"
    )

    print(
        f"AI API  : {AI_CHAT_URL}"
    )

    print(
        f"AI Chat : {AI_CONVERSATIONS_URL}"
    )

    print("=" * 60)

    print()


def result(
    name,
    ok,
    detail="",
):

    global passed
    global failed

    if ok:

        passed += 1

        print(
            f"[PASS] {name}"
        )

    else:

        failed += 1

        print(
            f"[FAIL] {name}"
        )

        if detail:

            print(
                f"       {detail}"
            )


def skip(
    name,
    detail="",
):

    global skipped

    skipped += 1

    print(
        f"[SKIP] {name}"
    )

    if detail:

        print(
            f"       {detail}"
        )


# ============================================================
# RESPONSE HELPERS
# ============================================================


def safe_json(response):

    try:

        return response.json()

    except ValueError:

        return None


def short_response(response):

    body = (
        response.text
        .strip()
        .replace("\n", " ")
    )

    if len(body) > 500:

        body = (
            body[:500]
            + "..."
        )

    return (
        f"HTTP {response.status_code}: "
        f"{body}"
    )


def extract_items(data):

    if isinstance(
        data,
        list,
    ):

        return data

    if isinstance(
        data,
        dict,
    ):

        for key in (
            "results",
            "data",
            "items",
        ):

            value = data.get(key)

            if isinstance(
                value,
                list,
            ):

                return value

    return []


def extract_text(data):

    if isinstance(
        data,
        str,
    ):

        return data

    if not isinstance(
        data,
        dict,
    ):

        return ""

    for key in (
        "answer",
        "response",
        "message",
        "content",
        "text",
        "reply",
    ):

        value = data.get(key)

        if isinstance(
            value,
            str,
        ):

            if value.strip():

                return value.strip()

        if isinstance(
            value,
            dict,
        ):

            nested = extract_text(
                value
            )

            if nested:

                return nested

    for key in (
        "data",
        "result",
    ):

        value = data.get(key)

        nested = extract_text(
            value
        )

        if nested:

            return nested

    return ""


def extract_conversation_id(data):

    if not isinstance(
        data,
        dict,
    ):

        return None

    # --------------------------------------------------------
    # Normal AI conversation serializer
    #
    # {
    #     "id": 1,
    #     "title": "Automated Test"
    # }
    # --------------------------------------------------------

    direct_id = data.get("id")

    if isinstance(
        direct_id,
        int,
    ):

        return direct_id

    if (
        isinstance(
            direct_id,
            str,
        )
        and direct_id.isdigit()
    ):

        return int(direct_id)

    # --------------------------------------------------------
    # Other possible formats
    # --------------------------------------------------------

    for key in (
        "conversation_id",
        "conversationId",
        "conversation",
    ):

        value = data.get(key)

        if isinstance(
            value,
            int,
        ):

            return value

        if (
            isinstance(
                value,
                str,
            )
            and value.isdigit()
        ):

            return int(value)

        if isinstance(
            value,
            dict,
        ):

            nested_id = value.get(
                "id"
            )

            if isinstance(
                nested_id,
                int,
            ):

                return nested_id

            if (
                isinstance(
                    nested_id,
                    str,
                )
                and nested_id.isdigit()
            ):

                return int(nested_id)

    return None


# ============================================================
# HTTP
# ============================================================


def request(
    method,
    url,
    **kwargs,
):

    kwargs.setdefault(
        "timeout",
        TIMEOUT,
    )

    return session.request(
        method,
        url,
        **kwargs,
    )


# ============================================================
# BACKEND
# ============================================================


def test_backend():

    try:

        response = request(
            "GET",
            f"{BASE_URL}/",
        )

        ok = (
            response.status_code
            < 500
        )

        result(
            "Backend is reachable",
            ok,
            short_response(
                response
            )
            if not ok
            else "",
        )

        return ok

    except requests.RequestException as error:

        result(
            "Backend is reachable",
            False,
            str(error),
        )

        return False


# ============================================================
# LOGIN
# ============================================================


def login():

    global access_token
    global refresh_token

    try:

        response = request(
            "POST",
            f"{BASE_URL}/api/auth/login/",
            json={
                "username": (
                    ADMIN_USERNAME
                ),
                "password": (
                    ADMIN_PASSWORD
                ),
            },
        )

        data = safe_json(
            response
        )

        if (
            response.status_code != 200
            or not isinstance(
                data,
                dict,
            )
        ):

            result(
                "Admin login",
                False,
                short_response(
                    response
                ),
            )

            return False

        access_token = data.get(
            "access"
        )

        refresh_token = data.get(
            "refresh"
        )

        if not access_token:

            result(
                "Admin login",
                False,
                "No access token returned.",
            )

            return False

        session.headers.update(
            {
                "Authorization": (
                    f"Bearer {access_token}"
                )
            }
        )

        result(
            "Admin login",
            True,
        )

        return True

    except requests.RequestException as error:

        result(
            "Admin login",
            False,
            str(error),
        )

        return False


# ============================================================
# API TEST
# ============================================================


def test_api_list(
    name,
    path,
    minimum=0,
):

    try:

        response = request(
            "GET",
            f"{BASE_URL}{path}",
        )

        if response.status_code != 200:

            result(
                name,
                False,
                short_response(
                    response
                ),
            )

            return None

        data = safe_json(
            response
        )

        items = extract_items(
            data
        )

        ok = (
            isinstance(
                data,
                (list, dict),
            )
            and len(items)
            >= minimum
        )

        if ok:

            detail = (
                f"{len(items)} records."
            )

        else:

            detail = (
                f"Expected at least "
                f"{minimum} records, "
                f"found {len(items)}."
            )

        result(
            name,
            ok,
            detail,
        )

        return items

    except requests.RequestException as error:

        result(
            name,
            False,
            str(error),
        )

        return None


# ============================================================
# DASHBOARD
# ============================================================


def test_dashboard():

    possible_paths = [
        "/api/dashboard/",
        "/api/dashboard",
        "/api/analytics/",
        "/api/analytics",
    ]

    for path in possible_paths:

        try:

            response = request(
                "GET",
                f"{BASE_URL}{path}",
            )

            if response.status_code == 200:

                result(
                    "Dashboard / analytics API",
                    True,
                    f"Found at {path}",
                )

                return True

        except requests.RequestException:

            pass

    skip(
        "Dashboard / analytics API",
        (
            "No common dashboard endpoint "
            "was found."
        ),
    )

    return None


# ============================================================
# CREATE AI CONVERSATION
# ============================================================


def create_ai_conversation():

    global conversation_id

    try:

        response = request(
            "POST",
            AI_CONVERSATIONS_URL,
            json={
                "title": "Automated Test"
            },
        )

        if response.status_code not in (
            200,
            201,
        ):

            result(
                "AI conversation creation",
                False,
                short_response(
                    response
                ),
            )

            return False

        data = safe_json(
            response
        )

        conversation_id = (
            extract_conversation_id(
                data
            )
        )

        if conversation_id is None:

            result(
                "AI conversation creation",
                False,
                (
                    "Conversation was created "
                    "but no conversation ID "
                    "was returned."
                ),
            )

            print(
                f"       Response: {data}"
            )

            return False

        result(
            "AI conversation creation",
            True,
            (
                f"Conversation ID: "
                f"{conversation_id}"
            ),
        )

        return True

    except requests.RequestException as error:

        result(
            "AI conversation creation",
            False,
            str(error),
        )

        return False


# ============================================================
# AI REQUEST
# ============================================================


def ai_request(
    message,
    conversation=None,
):

    if conversation is None:

        conversation = conversation_id

    payload = {
        "message": message,
        "conversation_id": conversation,
    }

    try:

        response = request(
            "POST",
            AI_CHAT_URL,
            json=payload,
        )

        return (
            safe_json(response),
            response,
        )

    except requests.RequestException as error:

        return (
            None,
            error,
        )


# ============================================================
# AI TEST
# ============================================================


def test_ai(
    name,
    question,
    must_contain=None,
    must_not_contain=None,
    conversation=None,
):

    data, response = ai_request(
        question,
        conversation,
    )

    if isinstance(
        response,
        Exception,
    ):

        result(
            name,
            False,
            str(response),
        )

        return (
            None,
            None,
        )

    if response.status_code not in (
        200,
        201,
    ):

        result(
            name,
            False,
            short_response(
                response
            ),
        )

        return (
            None,
            None,
        )

    answer = extract_text(
        data
    )

    if not answer:

        result(
            name,
            False,
            (
                "AI returned no readable "
                "answer. "
                f"{short_response(response)}"
            ),
        )

        return (
            None,
            None,
        )

    answer_lower = (
        answer.lower()
    )

    # --------------------------------------------------------
    # Required content
    # --------------------------------------------------------

    if must_contain:

        missing = [

            item

            for item in must_contain

            if item.lower()
            not in answer_lower

        ]

        if missing:

            result(
                name,
                False,
                (
                    "Missing expected text: "
                    f"{missing}. "
                    f"Answer: {answer[:500]}"
                ),
            )

            return (
                answer,
                extract_conversation_id(
                    data
                ),
            )

    # --------------------------------------------------------
    # Forbidden content
    # --------------------------------------------------------

    if must_not_contain:

        found = [

            item

            for item in must_not_contain

            if item.lower()
            in answer_lower

        ]

        if found:

            result(
                name,
                False,
                (
                    "Unexpected text found: "
                    f"{found}. "
                    f"Answer: {answer[:500]}"
                ),
            )

            return (
                answer,
                extract_conversation_id(
                    data
                ),
            )

    result(
        name,
        True,
    )

    print(
        f"       AI: {answer[:300]}"
    )

    return (
        answer,
        extract_conversation_id(
            data
        ),
    )


# ============================================================
# AI TESTS
# ============================================================


def test_ai_asset_count():

    answer, cid = test_ai(

        "AI - asset count",

        "How many assets are there?",

        must_contain=[
            "8",
        ],

    )

    return answer is not None


def test_ai_available_assets():

    answer, cid = test_ai(

        "AI - available assets",

        "How many available assets are there?",

        must_contain=[
            "3",
        ],

    )

    return answer is not None


def test_ai_low_stock():

    answer, cid = test_ai(

        "AI - low stock",

        "Show me the low stock items.",

    )

    return answer is not None


def test_ai_general_knowledge():

    answer, cid = test_ai(

        "AI - general knowledge",

        "What is the capital of France?",

        must_contain=[
            "Paris",
        ],

    )

    return answer is not None


def test_ai_hallucination():

    answer, cid = test_ai(

        "AI - hallucination protection",

        "Tell me about asset XYZ-999999.",

        must_not_contain=[
            "XYZ-999999 is a",
            "XYZ-999999 is an",
            "XYZ-999999 has",
        ],

    )

    return answer is not None


def test_ai_memory():

    global conversation_id

    # --------------------------------------------------------
    # First message
    # --------------------------------------------------------

    first_answer, first_cid = test_ai(

        "AI - memory step 1",

        "Which assets are currently under repair?",

    )

    if first_answer is None:

        return False

    # Keep the conversation returned
    # by the backend.

    if first_cid is not None:

        conversation_id = first_cid

    # --------------------------------------------------------
    # Second message
    # --------------------------------------------------------

    second_answer, second_cid = test_ai(

        "AI - conversation memory",

        "What are their serial numbers?",

        conversation=conversation_id,

    )

    if second_answer is None:

        return False

    return True


# ============================================================
# MAIN
# ============================================================


def main():

    print_header()

    # ========================================================
    # BACKEND
    # ========================================================

    if not test_backend():

        print()

        print(
            "Backend is not running."
        )

        print()

        print(
            "Start it with:"
        )

        print(
            "    python manage.py runserver"
        )

        print()

        sys.exit(1)

    # ========================================================
    # LOGIN
    # ========================================================

    if not login():

        print()

        print(
            "Login failed."
        )

        print(
            "Check the test credentials."
        )

        print()

        sys.exit(1)

    # ========================================================
    # API TESTS
    # ========================================================

    print()

    print(
        "-" * 60
    )

    print(
        "API TESTS"
    )

    print(
        "-" * 60
    )

    test_api_list(
        "Assets API",
        "/api/assets/",
        minimum=1,
    )

    test_api_list(
        "Inventory API",
        "/api/inventory/",
        minimum=1,
    )

    test_api_list(
        "Assignments API",
        "/api/assignments/",
        minimum=1,
    )

    test_api_list(
        "Tickets API",
        "/api/tickets/",
        minimum=1,
    )

    test_dashboard()

    # ========================================================
    # AI TESTS
    # ========================================================

    print()

    print(
        "-" * 60
    )

    print(
        "AI TESTS"
    )

    print(
        "-" * 60
    )

    if not create_ai_conversation():

        print()

        print(
            "AI conversation creation failed."
        )

        print(
            "AI tests cannot continue."
        )

        print()

    else:

        test_ai_asset_count()

        test_ai_available_assets()

        test_ai_low_stock()

        test_ai_general_knowledge()

        test_ai_hallucination()

        test_ai_memory()

    # ========================================================
    # FINAL RESULT
    # ========================================================

    print()

    print(
        "=" * 60
    )

    print(
        " FINAL RESULT"
    )

    print(
        "=" * 60
    )

    print(
        f"Passed : {passed}"
    )

    print(
        f"Failed : {failed}"
    )

    print(
        f"Skipped: {skipped}"
    )

    print()

    total = (
        passed
        + failed
    )

    if failed == 0:

        print(
            f"SUCCESS: "
            f"{passed}/{total} tests passed."
        )

    else:

        print(
            f"ATTENTION: "
            f"{failed} test(s) failed."
        )

        print(
            "Read the FAIL lines above."
        )

    print()

    print(
        "=" * 60
    )

    print()


# ============================================================
# START
# ============================================================


if __name__ == "__main__":

    main()