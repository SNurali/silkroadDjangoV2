from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'excerpt', 'content', 'image', 'category', 'author_name', 'created_at']
