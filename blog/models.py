from django.db import models
from accounts.models import User

class Post(models.Model):
    CATEGORY_CHOICES = [
        ('discovery', 'Discovery'),
        ('food', 'Food'),
        ('tips', 'Tips'),
        ('history', 'History'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    excerpt = models.TextField(help_text="Short summary for the card")
    content = models.TextField()
    image = models.ImageField(upload_to='blog/', blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='discovery')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
