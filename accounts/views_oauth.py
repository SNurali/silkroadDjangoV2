"""
Google OAuth views for React frontend integration.
Handles OAuth callback and JWT token generation.
"""

import os
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from accounts.models import User
import requests


class GoogleOAuthLoginView(APIView):
    """
    Initiate Google OAuth flow.
    GET /api/auth/google/
    Redirects to Google OAuth consent screen.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        google_client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
        # Use dynamic redirect URI exactly matching .env/Google Console
        host = request.get_host()
        if '127.0.0.1' in host:
            host = host.replace('127.0.0.1', 'localhost')
        redirect_uri = f"{request.scheme}://{host}/auth/callback/google"
        
        # Build Google OAuth URL
        google_auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={google_client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope=email profile"
            f"&access_type=online"
        )
        
        return redirect(google_auth_url)


class GoogleOAuthCallbackView(APIView):
    """
    Handle Google OAuth callback.
    GET /api/auth/google/callback/?code=xxx
    Exchanges code for token, creates/updates user, returns JWT.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        code = request.GET.get('code')
        error = request.GET.get('error')
        print(f"DEBUG CALLBACK: code={code}, error={error}")
        if error:
            # Redirect to frontend with error
            # Try to get frontend URL from REFERER or default to :3000 for this project
            frontend_url = request.META.get('HTTP_REFERER', 'http://localhost:3000').split('/login')[0].split('/auth')[0]
            if 'localhost:8000' in frontend_url or '127.0.0.1:8000' in frontend_url:
                frontend_url = 'http://localhost:3000'
            return redirect(f"{frontend_url}/login?error={error}")
        
        if not code:
            return Response(
                {'error': 'Authorization code not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exchange code for access token
        token_url = "https://oauth2.googleapis.com/token"
        host = request.get_host()
        if '127.0.0.1' in host:
            host = host.replace('127.0.0.1', 'localhost')
        redirect_uri = f"{request.scheme}://{host}/auth/callback/google"
        
        token_data = {
            'code': code,
            'client_id': settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id'],
            'client_secret': settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret'],
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        try:
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
            access_token = tokens.get('access_token')
            
            # Get user info from Google
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {'Authorization': f'Bearer {access_token}'}
            user_info_response = requests.get(user_info_url, headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            # Create or update user
            email = user_info.get('email')
            google_id = user_info.get('id')
            name = user_info.get('name', email.split('@')[0])
            picture = user_info.get('picture')
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'is_active': True
                }
            )
            
            # Update name if changed
            if not created and user.name != name:
                user.name = name
                user.save()
            
            # Store social account info
            SocialAccount.objects.get_or_create(
                user=user,
                provider='google',
                defaults={
                    'uid': google_id,
                    'extra_data': user_info
                }
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token
            
            # Redirect to frontend with tokens
            frontend_url = 'http://localhost:3000' # Explicitly use 3000 for this project's dev env
            redirect_url = (
                f"{frontend_url}/auth/callback"
                f"?access_token={str(access)}"
                f"&refresh_token={str(refresh)}"
                f"&user_id={user.id}"
                f"&user_name={user.name}"
                f"&user_email={user.email}"
            )
            
            return redirect(redirect_url)
            
        except requests.exceptions.RequestException as e:
            frontend_url = 'http://localhost:3000'
            return redirect(f"{frontend_url}/login?error=oauth_failed")
        except Exception as e:
            frontend_url = 'http://localhost:3000'
            return redirect(f"{frontend_url}/login?error=server_error")


class GoogleOAuthStatusView(APIView):
    """
    Check if Google OAuth is configured.
    GET /api/auth/google/status/
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
        client_secret = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret']
        
        is_configured = bool(client_id and client_secret)
        
        return Response({
            'google_oauth_enabled': is_configured,
            'client_id': client_id if is_configured else None
        })
