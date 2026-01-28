from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ───────────────────────────────────────────────
# Security
# ───────────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fixed-key-12345')
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
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',

    # Local apps
    'accounts',
    'locations',
    'vendors',
    'hotels',
    'flights',
    'notifications',
    'cabs',
    'blog',
    'support_chatbot',
    'bookings',
    'config_module',
    'admin_panel',
    'payments',
    'analytics',
    
    # Third-party
    'captcha',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',

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
    'django.middleware.locale.LocaleMiddleware', # I18n
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # django-allauth
    'django.contrib.messages.middleware.MessageMiddleware',
    'config_module.middleware.MaintenanceMiddleware',
    'vendors.middleware.VendorContextMiddleware',
    'silkroad_backend.middleware.SecurityMiddleware',
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
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_DATABASE', 'silkroad'),
        'USER': os.getenv('DB_USERNAME', 'silkroad'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'silkroad'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'connect_timeout': 10,
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

# ───────────────────────────────────────────────
# Localization
# ───────────────────────────────────────────────

LANGUAGE_CODE = 'uz' # Default per Laravel config
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_L10N = True
LANGUAGES = [
    ('en', 'English'),
    ('ru', 'Russian'),
    ('uz', 'Uzbek'),
]
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]
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
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'login': '5/minute',
        'booking': '10/minute',
        'export': '5/minute',
    }
}

# ───────────────────────────────────────────────
# JWT
# ───────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=365),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ───────────────────────────────────────────────
# ✅ CORS SETTINGS
# ───────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = True  # ← DEV-режим

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://silkroad.local",
]

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
# Integrations (From Laravel .env)
# ───────────────────────────────────────────────

# Billing
YAGONA_BILLING_CLIENT = os.getenv('YAGONA_BILLING_KLIENT', 'silkroad')
YAGONA_BILLING_KLIENT_SECRET = os.getenv('YAGONA_BILLING_KLIENT_SECRET')
YAGONA_BILLING_MERCHANT_ID = os.getenv('YAGONA_BILLING_MERCHANT_ID')
FAKE_PAYMENT = int(os.getenv('FAKE_PAYMENT', 0)) == 1

# Google Auth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
WEB_GOOGLE_CLIENT_ID = os.getenv('WEB_GOOGLE_CLIENT_ID')
WEB_GOOGLE_CLIENT_SECRET = os.getenv('WEB_GOOGLE_CLIENT_SECRET')
WEB_GOOGLE_REDIRECT_URL = os.getenv('WEB_GOOGLE_REDIRECT_URL')

# Person Info (eMehmon)
PERSON_INFO_API = os.getenv('PERSON_INFO_API')
PERSON_INFO_FOREIGN_API = os.getenv('PERSON_INFO_FOREIGN_API')
PERSON_INFO_SECRET = os.getenv('PERSON_INFO_SECRET')

# ClickHouse (Analytics)
CLICKHOUSE_HOST = os.getenv('CLICKHOUSE_HOST')
CLICKHOUSE_PORT = os.getenv('CLICKHOUSE_PORT')
CLICKHOUSE_DATABASE = os.getenv('CLICKHOUSE_DATABASE')
CLICKHOUSE_USERNAME = os.getenv('CLICKHOUSE_USERNAME')
CLICKHOUSE_PASSWORD = os.getenv('CLICKHOUSE_PASSWORD')

# AI Chatbot
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Telegram Bot
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# Open WebUI Integration
OPEN_WEBUI_URL = os.getenv('OPEN_WEBUI_URL', 'http://localhost:3000')
OPEN_WEBUI_API_KEY = os.getenv('OPEN_WEBUI_API_KEY')
OPEN_WEBUI_MODEL = os.getenv('OPEN_WEBUI_MODEL', 'gpt-4o')

# ───────────────────────────────────────────────
# CAPTCHA Settings
# ───────────────────────────────────────────────

CAPTCHA_IMAGE_SIZE = (120, 50)
CAPTCHA_FONT_SIZE = 32
CAPTCHA_BACKGROUND_COLOR = '#f8f9fa'
CAPTCHA_FOREGROUND_COLOR = '#1e40af'
CAPTCHA_CHALLENGE_FUNCT = 'captcha.helpers.math_challenge'
CAPTCHA_NOISE_FUNCTIONS = ('captcha.helpers.noise_dots',)
CAPTCHA_LENGTH = 4
CAPTCHA_TIMEOUT = 5  # Minutes

# ───────────────────────────────────────────────
# Django AllAuth - Social Authentication
# ───────────────────────────────────────────────

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
)

SITE_ID = 1

# AllAuth Configuration
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'optional'  # 'mandatory' | 'optional' | 'none'
ACCOUNT_UNIQUE_EMAIL = True
SOCIALACCOUNT_AUTO_SIGNUP = True

# After login redirect
LOGIN_REDIRECT_URL = '/'
ACCOUNT_LOGOUT_REDIRECT_URL = '/'

# Social Providers
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'APP': {
            'client_id': os.getenv('WEB_GOOGLE_CLIENT_ID', ''),
            'secret': os.getenv('WEB_GOOGLE_CLIENT_SECRET', ''),
            'key': ''
        }
    }
}


# ───────────────────────────────────────────────
# ✅ CELERY SETTINGS (Async Tasks)
# ───────────────────────────────────────────────

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Cache configuration (Redis)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
