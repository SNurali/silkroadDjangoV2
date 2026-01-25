from django.core.management.base import BaseCommand
from blog.models import Post
from accounts.models import User

class Command(BaseCommand):
    help = 'Populate blog posts'

    def handle(self, *args, **kwargs):
        # Get or create a dummy author
        author, _ = User.objects.get_or_create(email='admin@silkroad.com', defaults={'full_name': 'SilkRoad Editor', 'role': 'admin'})

        posts = [
            {
                "title": "Hidden Gems of Samarkand: Beyond the Registan",
                "slug": "hidden-gems-samarkand",
                "excerpt": "Explore the narrow streets and ancient mausoleums that tourists often miss in the city of blue tiles.",
                "content": "Full content about Samarkand...",
                "category": "discovery"
            },
            {
                "title": "A Foodie’s Tour: 5 Must-Try Dishes in Bukhara",
                "slug": "foodie-tour-bukhara",
                "excerpt": "From traditional Bukhara plov to unique herbal teas, a culinary journey through history.",
                "content": "Full content about Plov...",
                "category": "food"
            },
            {
                "title": "Traveler’s Guide: Taking the Afrosiyob Train",
                "slug": "afrosiyob-guide",
                "excerpt": "Everything you need to know about Uzbekistan’s high-speed rail network connecting major cities.",
                "content": "Full content about Trains...",
                "category": "tips"
            },
             {
                "title": "Khiva: An Open-Air Museum City",
                "slug": "khiva-museum-city",
                "excerpt": "Walking through Itchan Kala feels like stepping back in time. Here is your 2-day itinerary.",
                "content": "Full content about Khiva...",
                "category": "history"
            }
        ]

        for p in posts:
            Post.objects.get_or_create(slug=p['slug'], defaults={**p, 'author': author})
        
        self.stdout.write(self.style.SUCCESS('Successfully populated Blog'))
