from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ───────────────────────────────────────────────
# Security
# ───────────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# ───────────────────────────────────────────────
# Applications
# ───────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # CORS
    'corsheaders',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',

    # Local apps
    'accounts',
    'locations',
    'vendors',
    'hotels',

    'silkroad_backend.apps.SilkroadBackendConfig',
]

AUTH_USER_MODEL = 'accounts.User'

# ───────────────────────────────────────────────
# Middleware  ⚠️ ВАЖЕН ПОРЯДОК
# ───────────────────────────────────────────────

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # ← ОБЯЗАТЕЛЬНО ПЕРВЫМ
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# ───────────────────────────────────────────────
# URLs / WSGI
# ───────────────────────────────────────────────

ROOT_URLCONF = 'silkroad_backend.urls'
WSGI_APPLICATION = 'silkroad_backend.wsgi.application'

# ───────────────────────────────────────────────
# Templates
# ───────────────────────────────────────────────

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ───────────────────────────────────────────────
# Database
# ───────────────────────────────────────────────

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'silkroad_django_db',
        'USER': 'django',
        'PASSWORD': 'django123',
        'HOST': '127.127.126.32',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

# ───────────────────────────────────────────────
# Password validation
# ───────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ───────────────────────────────────────────────
# Localization
# ───────────────────────────────────────────────

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# ───────────────────────────────────────────────
# Static & Media
# ───────────────────────────────────────────────

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ───────────────────────────────────────────────
# REST Framework
# ───────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # ← ДЛЯ REACT (иначе 401)
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}

# ───────────────────────────────────────────────
# JWT
# ───────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ───────────────────────────────────────────────
# ✅ CORS SETTINGS (КЛЮЧЕВОЕ)
# ───────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = True  # ← DEV-режим (можно безопасно)

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    'accept',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ───────────────────────────────────────────────
# Billing
# ───────────────────────────────────────────────

YAGONA_BILLING_KLIENT = "silkroad"
YAGONA_BILLING_KLIENT_SECRET = "84afc0e173cf4e5bbf172d5fc2f0b1341748000565676"
YAGONA_BILLING_MERCHANT_ID = "mrt_2xUlMPmoEcHKPRTtfoR1M8CKRKg"
FAKE_PAYMENT = True
