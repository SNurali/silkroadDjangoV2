import logging
from django.utils.deprecation import MiddlewareMixin
from accounts.models import SecurityLog

logger = logging.getLogger(__name__)

class SecurityMiddleware(MiddlewareMixin):
    """
    Adds security headers and logs sensitive actions.
    """
    def process_response(self, request, response):
        # Security Headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;"
        
        # Audit Logging for sensitive routes (POST/DELETE on specific paths)
        if request.method in ['POST', 'DELETE', 'PUT']:
            path = request.path
            sensitive_keywords = ['login', 'pay', 'export', 'delete', 'create', 'update']
            if any(keyword in path for keyword in sensitive_keywords):
                self.log_security_event(request, response)
        
        return response

    def log_security_event(self, request, response):
        user = request.user if request.user.is_authenticated else None
        action = f"{request.method} {request.path}"
        ip = self.get_client_ip(request)
        
        try:
            SecurityLog.objects.create(
                user=user,
                action=action,
                ip_address=ip,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'status_code': response.status_code}
            )
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
