from django.conf import settings

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def set_auth_cookies(response, *, access: str, refresh: str) -> None:
    """httpOnly cookies are the only place the raw JWTs live client-side —
    the frontend never reads or stores them; the browser just carries them
    back automatically. `secure=not settings.DEBUG` because local dev runs
    over plain http.
    """

    common = {
        "httponly": True,
        "samesite": "Lax",
        "secure": not settings.DEBUG,
        "path": "/",
    }
    response.set_cookie(ACCESS_COOKIE, access, max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()), **common)
    response.set_cookie(REFRESH_COOKIE, refresh, max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()), **common)


def clear_auth_cookies(response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/", samesite="Lax")
    response.delete_cookie(REFRESH_COOKIE, path="/", samesite="Lax")
