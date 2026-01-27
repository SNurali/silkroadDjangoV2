from django.urls import path
from .views_oauth import GoogleOAuthCallbackView

urlpatterns = [
    path('', GoogleOAuthCallbackView.as_view(), name='google_callback_legacy'),
]
