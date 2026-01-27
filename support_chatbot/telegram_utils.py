import requests
from django.conf import settings

def send_telegram_notification(message, conversation_id=None):
    """
    Sends a message to the configured Telegram group/channel.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        print(f"DEBUG: Telegram config missing! Token: {'Set' if token else 'None'}, ChatID: {'Set' if chat_id else 'None'}")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    final_message = message
    if conversation_id:
        link = f"http://localhost:3000/support-chat/{conversation_id}"
        final_message += f"\n\n🔗 <b>Support Link:</b> {link}\n(Click 'Open Chat' or copy the link above)\n<a href='{link}'>Open Chat</a>"

    payload = {
        'chat_id': chat_id,
        'text': final_message,
        'parse_mode': 'HTML'
    }

    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print("DEBUG: Telegram sent successfully.")
            return True
        else:
            print(f"DEBUG: Telegram Error {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"DEBUG: Failed to send Telegram notification: {e}")
        return False
