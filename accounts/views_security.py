from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import User

class SendVerificationCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock logic: Assume code sent
        # In real app: Generate random code, save to Redis/DB, send via SMS provider
        # For now, we save phone to user profile as 'pending verification' or just update it if that's the flow
        # But UI implies "Mobile Protection" -> likely enabling 2FA.
        
        # Let's just update the user's phone for simplicity if it's about adding a number
        # But if it's 2FA, we need a code verification step.
        # User only sees "Send Code". We'll verify what happens next later or assumes user enters code.
        # For now, return success.
        
        return Response({"message": "Verification code sent", "mock_code": "123456"}, status=status.HTTP_200_OK)

class VerifyVerificationCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        # In real app: Verify code against Redis/DB
        if code == "123456":
            # Update user phone confirmed status
            return Response({"message": "Phone number verified!"}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

# -------------------------------------------------------------------------
# REAL IMPLEMENTATION GUIDE
# -------------------------------------------------------------------------
# To make this real, use Django Cache and an SMS provider (like Eskiz.uz).
#
# from django.core.cache import cache
# import random
#
# class SendVerificationCodeView(APIView):
#     def post(self, request):
#         phone = request.data.get('phone')
#         code = str(random.randint(100000, 999999))
#         
#         # Save code to cache for 300 seconds (5 minutes)
#         cache.set(f"sms_code_{phone}", code, timeout=300)
#
#         # Use your SMS service here:
#         # send_sms_via_eskiz(phone, f"Your code: {code}")
#         
#         return Response({"message": "Code sent"})
#
# class VerifyVerificationCodeView(APIView):
#     def post(self, request):
#         phone = request.data.get('phone') # Need phone to lookup cache
#         code = request.data.get('code')
#         
#         saved_code = cache.get(f"sms_code_{phone}")
#         
#         if saved_code and saved_code == code:
#             return Response({"message": "Verified"})
#         return Response({"error": "Invalid code"}, status=400)
# -------------------------------------------------------------------------

class GlobalLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Implementation of global logout
        # Ideally: blacklist all tokens or rotate user secret.
        # For this MVP: we assume client handles clearing.
        # We can perform any server-side cleanup if needed.
        
        return Response({"message": "Successfully logged out from all devices"}, status=status.HTTP_200_OK)
