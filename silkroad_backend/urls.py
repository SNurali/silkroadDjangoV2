from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.conf.urls.i18n import i18n_patterns

urlpatterns = [
    # API Routes (Header-based I18n)
    path('api/accounts/', include('accounts.urls')),
    path('api/vendors/', include('vendors.urls')),
    path('api/locations/', include('locations.urls')),
    # Hotels API (Directly)
    path('api/hotels/', include('hotels.urls_api')), 
    path('api/flights/', include('flights.urls')), # New flights app
    path('api/notifications/', include('notifications.urls')),
    path('api/cabs/', include('cabs.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/chat/', include('support_chatbot.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/analytics/', include('analytics.urls')),
    
    # CAPTCHA
    path('captcha/', include('captcha.urls')),
    
    # Google OAuth Redirect (Parity with Laravel config)
    path('auth/callback/google', include([
        path('', include('accounts.urls_oauth')),
    ])),
    
    # AllAuth - Social Authentication
    path('accounts/', include('allauth.urls')),
    
    # Admin Panel
    path('admin-panel/', include('admin_panel.urls')),
    
    # Integrations
    path('api/integrations/emehmon/', include('integrations.emehmon.urls')),
    path('api/integrations/payments/', include('integrations.payments.urls')),
]

urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    # Keep API outside i18n_patterns to avoid /en/api/ prefix unless desired.
    # But user wants /en/ /ru/ prefixes. If primarily for Frontend, that's Frontend routing.
    # If standard views existed, we'd add checks. Here we just add admin.
    path('', include('hotels.urls')), # If hotels.urls has views suitable for this
    prefix_default_language=False,
)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)