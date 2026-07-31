from django.http import JsonResponse
from rest_framework.views import exception_handler as drf_exception_handler


def json_500_handler(request, *args, **kwargs):
    """DRF's exception_handler (above) only runs for APIException subclasses
    raised inside a view DRF actually dispatched to. A genuine bug (e.g. an
    unhandled TypeError) bypasses it entirely and would otherwise fall
    through to Django's default HTML error page — breaking every frontend
    `.json()` call on a 500. Wired as `handler500` in config/urls.py.
    """
    return JsonResponse(
        {"success": False, "message": "Internal server error.", "data": None}, status=500
    )


def envelope_exception_handler(exc, context):
    """Wraps DRF's default error handling into the {success, message, data}
    envelope, preserving the original status code. Unhandled (non-APIException)
    exceptions fall through to Django's own 500 handling — see
    config/urls.py::handler500 for the JSON-envelope fallback on API routes,
    since DRF's exception_handler is never invoked for those at all.
    """

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data
    message = _first_message(detail)

    response.data = {
        "success": False,
        "message": message,
        "data": detail if not isinstance(detail, dict) or "detail" not in detail else None,
    }
    return response


def _first_message(detail) -> str:
    if isinstance(detail, dict):
        if "detail" in detail:
            return str(detail["detail"])
        for value in detail.values():
            return _first_message(value)
        return "An error occurred."
    if isinstance(detail, list) and detail:
        return str(detail[0])
    return str(detail)
