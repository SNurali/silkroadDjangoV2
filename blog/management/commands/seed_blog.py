from django.core.management.base import BaseCommand
from blog.models import Post
from accounts.models import User
from django.core.files import File
from django.utils.text import slugify
import os

class Command(BaseCommand):
    help = 'Seeds the database with sample blog posts'

    def handle(self, *args, **kwargs):
        # Get or create author
        author = User.objects.filter(is_superuser=True).first()
        if not author:
            author = User.objects.first()
        if not author:
            self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
            return

        # Image paths
        base_img_path = '/home/mrnurali/PycharmProjects/SilkRoad/silkroadDjangoV2/silkroad-frontend/public/images/'
        tashkent_img = os.path.join(base_img_path, 'destinations/tashkent.png')
        hero_img = os.path.join(base_img_path, 'hero.png')
        istanbul_img = os.path.join(base_img_path, 'destinations/istanbul.png')
        
        # Fallback if specific images not found, try to use any valid one
        valid_img = None
        for img in [tashkent_img, hero_img, istanbul_img]:
            if os.path.exists(img):
                valid_img = img
                break
        
        posts_data = [
            {
                "title": "Hidden Gems of Samarkand: Beyond the Registan",
                "content": "Samarkand is more than just the Registan Square. Explore the ancient narrow streets...",
                "excerpt": "Explore the narrow alleys and ancient mausoleums that tourists often miss in the city of blue tiles.",
                "category": "discovery",
                "image_path": tashkent_img if os.path.exists(tashkent_img) else valid_img
            },
            {
                "title": "Taste tracking: 5 Must-Try Dishes in Bukhara",
                "content": "Bukhara offers a unique culinary journey. Check out Plov and other delights...",
                "excerpt": "From the traditional Bukhara Plov to the unique tea herb mixes, a culinary journey through history.",
                "category": "food",
                "image_path": hero_img if os.path.exists(hero_img) else valid_img
            },
            {
                "title": "Travelers Guide to Riding the Afrosiyob Train",
                "content": "The high speed train connects Tashkent, Samarkand and Bukhara. Here is how to book...",
                "excerpt": "Everything you need to know about Uzbekistan's high-speed rail network connecting the history.",
                "category": "tips",
                "image_path": istanbul_img if os.path.exists(istanbul_img) else valid_img
            },
            {
                "title": "Khiva: The Open-Air Museum City",
                "content": "Ichan Kala is a UNESCO world heritage site that feels like stepping back in time...",
                "excerpt": "Walking through the Ichan Kala is like stepping back in time. Here's a 2-day itinerary.",
                "category": "history",
                "image_path": tashkent_img if os.path.exists(tashkent_img) else valid_img
            }
        ]

        for p_data in posts_data:
            if not Post.objects.filter(title=p_data['title']).exists():
                post = Post(
                    title=p_data['title'],
                    slug=slugify(p_data['title']),
                    excerpt=p_data['excerpt'],
                    content=p_data['content'],
                    category=p_data['category'],
                    author=author
                )
                
                if p_data['image_path'] and os.path.exists(p_data['image_path']):
                    with open(p_data['image_path'], 'rb') as img_file:
                        post.image.save(os.path.basename(p_data['image_path']), File(img_file), save=False)
                
                post.save()
                self.stdout.write(self.style.SUCCESS(f'Created post: {post.title}'))
            else:
                self.stdout.write(f'Post already exists: {p_data["title"]}')

        self.stdout.write(self.style.SUCCESS('Blog seeding complete!'))
