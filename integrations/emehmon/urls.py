from django.urls import path
from .views import EMehmonWebhookView

urlpatterns = [
    path('webhook/', EMehmonWebhookView.as_view(), name='emehmon_webhook'),
]
