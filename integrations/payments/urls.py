from django.urls import path
from .views import YagonaWebhookView

urlpatterns = [
    path('webhook/', YagonaWebhookView.as_view(), name='yagona_webhook'),
]
