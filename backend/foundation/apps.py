from django.apps import AppConfig


class FoundationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "foundation"

    def ready(self):
        import foundation.signals  # noqa: F401
