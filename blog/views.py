from rest_framework import viewsets
from .models import Post
from .serializers import PostSerializer
from rest_framework.permissions import AllowAny

class PostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
