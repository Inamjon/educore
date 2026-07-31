from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_custom.models import LoginAttempt, Session
from auth_custom.serializers import LoginSerializer, RefreshRequestSerializer, SessionSerializer
from auth_custom.services import token_service
from auth_custom.services.session_service import BYPASS_ALIAS, revoke_session
from common.audit import audit_log
from foundation.models import User


class LoginView(APIView):
    """No email — login_id + password (see plan decision 2). This whole
    request runs before any org context exists (that's what it establishes),
    so every DB access here deliberately goes through the BYPASSRLS
    connection alias, not just the initial lookup.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login_id = serializer.validated_data["login_id"]
        password = serializer.validated_data["password"]

        user = User.objects.using(BYPASS_ALIAS).filter(login_id=login_id).first()

        if user is None or not user.check_password(password):
            self._log_attempt(request, login_id, user, "failed", "invalid_credentials")
            raise AuthenticationFailed("Invalid login ID or password.")

        if user.status != "active":
            self._log_attempt(request, login_id, user, "blocked", f"account_{user.status}")
            raise AuthenticationFailed(f"Account is {user.status}.")

        tokens = token_service.issue_tokens_for_new_session(user=user, request=request)

        User.objects.using(BYPASS_ALIAS).filter(pk=user.pk).update(last_login=timezone.now())
        self._log_attempt(request, login_id, user, "success", None)
        audit_log(request, action="login", entity_type="user", entity_id=str(user.id), user=user, using=BYPASS_ALIAS)

        return Response(
            {
                "success": True,
                "message": "Logged in",
                "data": {
                    **tokens,
                    "user": {
                        "id": str(user.id),
                        "login_id": user.login_id,
                        "full_name": user.get_full_name(),
                        "organization_id": str(user.organization_id),
                        "status": user.status,
                    },
                },
            }
        )

    @staticmethod
    def _log_attempt(request, login_id: str, user, status_value: str, reason: str | None) -> None:
        LoginAttempt.objects.using(BYPASS_ALIAS).create(
            organization=user.organization if user else None,
            user=user,
            login_id=login_id,
            status=status_value,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            failure_reason=reason,
        )


class RefreshView(APIView):
    """SIMPLE_JWT ROTATE_REFRESH_TOKENS=True means the client gets a new
    refresh token on every call too (single-use) — this reuses the existing
    Session row rather than creating a new one, so the Active Sessions UI
    doesn't get a new "device" entry every 15 minutes.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_refresh = serializer.validated_data["refresh"]

        try:
            tokens = token_service.rotate_tokens(raw_refresh_token=raw_refresh, request=request)
        except ValueError as exc:
            raise AuthenticationFailed(str(exc)) from exc

        return Response({"success": True, "message": "", "data": tokens})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_refresh = request.data.get("refresh")
        if raw_refresh:
            token_service.revoke_refresh_token(raw_refresh, reason="logout")

        session_id = request.auth.get("session_id") if request.auth else None
        if session_id:
            session = Session.objects.using(BYPASS_ALIAS).filter(pk=session_id).first()
            if session:
                revoke_session(session, reason="logout")

        audit_log(request, action="logout", entity_type="user", entity_id=str(request.user.id))
        return Response({"success": True, "message": "Logged out", "data": None})


class SessionListView(APIView):
    def get(self, request):
        sessions = Session.objects.filter(user=request.user, is_active=True).order_by("-last_activity_at")
        current_session_id = request.auth.get("session_id") if request.auth else None
        serializer = SessionSerializer(sessions, many=True, context={"current_session_id": current_session_id})
        return Response({"success": True, "message": "", "data": serializer.data})


class SessionRevokeView(APIView):
    def post(self, request, session_id):
        session = Session.objects.filter(pk=session_id, user=request.user, is_active=True).first()
        if session is None:
            return Response(
                {"success": False, "message": "Session not found.", "data": None},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_session_id = request.auth.get("session_id") if request.auth else None
        if str(session.id) == str(current_session_id):
            return Response(
                {"success": False, "message": "Cannot revoke your current session — use logout instead.", "data": None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        revoke_session(session, reason="user_revoked")
        audit_log(request, action="update", entity_type="session", entity_id=str(session.id))
        return Response({"success": True, "message": "Session revoked", "data": None})
