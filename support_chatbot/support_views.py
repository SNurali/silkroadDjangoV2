from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import MessageSerializer

class SupportSendView(APIView):
    """
    API for support agents to send messages to a conversation.
    """
    permission_classes = [AllowAny]
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        text = request.data.get('text')
        
        if not text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        message = Message.objects.create(
            conversation=conversation,
            sender='support',
            text=text
        )
        
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

class ConversationHistoryView(APIView):
    """
    API to get history of a specific conversation for support interface.
    """
    permission_classes = [AllowAny]
    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
