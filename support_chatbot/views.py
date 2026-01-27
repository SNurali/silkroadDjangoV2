from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from django.conf import settings
import google.generativeai as genai
import os
import requests

# Initialize Gemini
if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

class ChatBotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        conversation_id = request.data.get('conversation_id')
        text = request.data.get('text', '')
        attachment = request.FILES.get('attachment')

        if not text and not attachment:
             return Response({'error': 'Message text or attachment is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
                if user and conversation.user != user:
                     return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            conversation = Conversation.objects.create(user=user)

        # Save User Message
        user_message = Message.objects.create(
            conversation=conversation,
            sender='user',
            text=text,
            attachment=attachment
        )

        # Generate Bot Response
        bot_response_text = self.generate_bot_response(text, attachment, conversation.id)
        
        bot_message_data = None
        if bot_response_text:
            bot_message = Message.objects.create(
                conversation=conversation,
                sender='bot',
                text=bot_response_text
            )
            bot_message_data = {
                'text': bot_response_text,
                'timestamp': bot_message.timestamp
            }

        return Response({
            'conversation_id': conversation.id,
            'user_message': text,
            'bot_message': bot_message_data['text'] if bot_message_data else None,
            'timestamp': bot_message_data['timestamp'] if bot_message_data else None,
            'attachment_url': user_message.attachment.url if user_message.attachment else None
        })

    def generate_bot_response(self, user_text, attachment=None, conversation_id=None):
        text_lower = user_text.lower() if user_text else ""

        # 0. Check if a human support agent has already joined this conversation
        if conversation_id:
            has_support = Message.objects.filter(conversation_id=conversation_id, sender='support').exists()
            if has_support:
                # If a support person has already replied, the bot stays silent
                return None

        # 1. Quick Action & Human Handoff Intents (Highest Priority)
        human_keywords = [
            'human', 'operator', 'agent', 'support', 'help', 'problem', 'error', # EN
            'оператор', 'поддерж', 'помощ', 'проблем', 'ошибк', # RU
            'operator', 'yordam', 'muammo', 'xato' # UZ
        ]
        if any(k in text_lower for k in human_keywords):
            # Trigger Telegram Notification
            try:
                from .telegram_utils import send_telegram_notification
                display_msg = f"🆘 <b>Support Request</b>\nUser: Guest\nMessage: {user_text}"
                send_telegram_notification(display_msg, conversation_id)
            except Exception as e:
                print(f"Telegram fail: {e}")
            
            return "I have notified our support team. They will contact you shortly."

        if any(k in text_lower for k in ['hotel', 'stay', 'accommodation']):
            return "You can find our best hotels here: [Find Hotels](/hotels)"
            
        if any(k in text_lower for k in ['tour', 'trip', 'guide']):
            return "Explore our guided tours here: [Find Tours](/tours)"

        # 2. Try Open WebUI (New 2026 Standard)
        if settings.OPEN_WEBUI_API_KEY:
            try:
                ow_response = self.get_open_webui_response(user_text, conversation_id)
                if ow_response:
                    return ow_response
            except Exception as e:
                print(f"Open WebUI Error: {e}")

        # 3. Try Gemini as second choice
        if model:
            try:
                prompt_parts = []
                if user_text:
                    prompt_parts.append(user_text)
                
                if attachment:
                    content_type = attachment.content_type
                    if content_type.startswith('image/'):
                        try:
                            from PIL import Image
                            img = Image.open(attachment)
                            prompt_parts.append(img)
                        except Exception as img_err:
                            print(f"Error processing image: {img_err}")
                            prompt_parts.append("\n[User sent an image that could not be processed]")
                    else:
                        prompt_parts.append(f"\n[User sent a file: {attachment.name}]")
                
                if not prompt_parts:
                    return "I received an empty message."

                response = model.generate_content(prompt_parts)
                return response.text
            except Exception as e:
                print(f"Gemini API Error: {e}")
                # Fall through to rule-based on error
                pass

        # 4. Smart Rule-Based Fallback (Offline Mode)
        # Image Fallback
        if attachment:
            if not text_lower:
                return "I received your file. A human agent will review it shortly."
            return f"I see you attached a file with your message: '{user_text}'. Our support team will check it."

        # Keyword Matching rules
        rules = [
            (['hello', 'hi', 'hey', 'greetings'], "Hello! Welcome to SilkRoad Support. How can I assist you today?"),
            (['price', 'cost', 'expensive', 'cheap'], "Our prices are very competitive! You can check specific hotel or tour prices on their respective pages."),
            (['book', 'reservation', 'schedule'], "You can make a booking directly through our website. Just visit the Hotel or Tour page and click 'Book Now'."),
            (['taxi', 'cab', 'transport'], "Need a ride? Our Cab service is available 24/7. You can book one from the 'Cabs' page."),
            (['visa', 'passport', 'entry'], "For visa information, please check our 'Visa' page where we list requirements for different countries."),
            (['thank', 'thanks'], "You're welcome! Let me know if you need anything else."),
            (['bye', 'goodbye'], "Goodbye! Have a great day!")
        ]

        for keywords, response in rules:
            if any(k in text_lower for k in keywords):
                return response

        # Default Response
        return "I'm currently in 'Offline Mode' (Rule-Based). I can answer basic questions about hotels, tours, bookings, and visas. For complex queries, please click 'Human Support'."

    def get_open_webui_response(self, text, conversation_id):
        """
        Calls the Open WebUI (Ollama/OpenAI compatible) API.
        """
        url = f"{settings.OPEN_WEBUI_URL}/api/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPEN_WEBUI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # We can pass history here if needed, but for now just the current prompt
        payload = {
            "model": settings.OPEN_WEBUI_MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant for SilkRoad.uz, a platform for hotels, tours, and travel in Uzbekistan."},
                {"role": "user", "content": text}
            ],
            "stream": False
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            return None
        except Exception as e:
            print(f"Open WebUI API Link Error: {e}")
            return None
