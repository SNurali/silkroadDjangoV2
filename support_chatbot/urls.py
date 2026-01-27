from django.urls import path, include
from django.urls import path
from .views import ChatBotView
from .support_views import SupportSendView, ConversationHistoryView

urlpatterns = [
    path('send/', ChatBotView.as_view(), name='chatbot_send'),
    path('support/send/<int:conversation_id>/', SupportSendView.as_view(), name='support_send'),
    path('support/history/<int:conversation_id>/', ConversationHistoryView.as_view(), name='support_history'),
]
