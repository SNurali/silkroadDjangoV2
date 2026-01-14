from django.apps import AppConfig


class SilkroadBackendConfig(AppConfig):
    """
    Конфигурация основного приложения проекта.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'silkroad_backend'