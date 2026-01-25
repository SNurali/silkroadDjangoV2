from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import UploadImageView, UserGalleryViewSet
from .views_security import SendVerificationCodeView, VerifyVerificationCodeView, GlobalLogoutView
from rest_framework_simplejwt.views import TokenObtainPairView

app_name = 'accounts'

router = DefaultRouter()
router.register(r'me/images', UserGalleryViewSet, basename='user-gallery')
router.register(r'travelers', views.TravelerViewSet, basename='travelers')
# route: /accounts/me/images/ -> list/create(if allowed)
# But user requested:
# path('me/images/', UploadImageView.as_view(), name='upload-image'),
# path('me/images/', UserGalleryViewSet.as_view({'get': 'list', 'delete': 'destroy'})),
# This conflicts on 'me/images/' path.
# User wants POST to go to UploadImageView, GET/DELETE to ViewSet.
# We can map explicitly.

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('security/send-code/', SendVerificationCodeView.as_view(), name='send-code'),
    path('security/verify-code/', VerifyVerificationCodeView.as_view(), name='verify-code'),
    path('security/global-logout/', GlobalLogoutView.as_view(), name='global-logout'),

    # Image Upload (POST)
    path('me/images/upload/', UploadImageView.as_view(), name='upload_image'), 
    # Or strict 'me/images/' for POST?
    # If we map 'me/images/' to ViewSet for GET, we can map 'me/images/' to UploadImageView for POST?
    # DRF ViewSet handles actions. Using APIView separate complicates usage on SAME URL.
    # I will use 'me/images/upload/' for UploadImageView to avoid conflict, or Map ViewSet actions carefully.
    # User Request: "path('me/images/', UploadImageView.as_view()...), path('me/images/', UserGalleryViewSet...)"
    # This implies using method-based dispatching?
    # ViewSet handles GET/DELETE. UploadImageView handles POST.
    # I can try to use URL patterns order or separate them.
    # However, 'me/images/' regex will match first one.
    # If request is GET, and first is UploadImageView (POST only), it sends 405 Method Not Allowed.
    # I should combine them or use different paths.
    # I will put UploadImageView on 'me/images/' but only for POST?
    # Actually, using a ViewSet for everything is better, but user requested specific APIView logic.
    # I'll use 'me/images/' for ViewSet (GET, DELETE, PATCH), and 'me/images/upload' for POST.
    # OR, better: Map POST of 'me/images/' to UploadImageView?
    # I can write a path that points to a view function that dispatches?
    # I will adhere to safer 'me/images/upload' for the explicit UploadImageView to avoid 405 issues comfortably,
    # OR better: UserGalleryViewSet (ModelViewSet) already has 'create'. I could have overriden 'create' there?
    # But user specifically asked for "UploadImageView (APIView, not ViewSet...)".
    # I will add 'upload/' suffix for clarity.
    
    path('me/images/upload/', UploadImageView.as_view(), name='upload-image'),
    
    # Gallery (GET, DELETE, PATCH)
    # Using Router is easiest for ViewSets.
    path('', include(router.urls)), 
]