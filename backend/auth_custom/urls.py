from django.urls import path

from auth_custom.views import LoginView, LogoutView, RefreshView, SessionListView, SessionRevokeView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("sessions/", SessionListView.as_view(), name="session-list"),
    path("sessions/<uuid:session_id>/revoke/", SessionRevokeView.as_view(), name="session-revoke"),
]
