from django.http import JsonResponse
from django.conf import settings
from .models import SystemConfig

class MaintenanceMiddleware:
    """
    Middleware для проверки режима технического обслуживания.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Проверяем флаг в базе данных (или кэше)
        # В продакшене лучше использовать Redis для этого
        is_maintenance = SystemConfig.get_value('system_maintenance', False)
        
        if is_maintenance:
            # Разрешаем доступ к админке и определенным путям
            if request.path.startswith('/admin/') or request.path.startswith('/api/v1/auth/'):
                return self.get_response(request)
            
            # Разрешаем доступ суперпользователям
            if request.user.is_authenticated and request.user.is_superuser:
                return self.get_response(request)

            return JsonResponse(
                {
                    "error": "System Maintenance",
                    "message": "Система находится на техническом обслуживании. Пожалуйста, попробуйте позже."
                },
                status=503
            )

        return self.get_response(request)
