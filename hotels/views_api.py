from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from django.db.models import Avg, Count, Q
from captcha.models import CaptchaStore
from captcha.helpers import captcha_image_url
from .models import Sight, Ticket, TicketDetail, HotelComment, Hotel
from .serializers import TicketCreateSerializer, HotelCommentSerializer
import base64
import hashlib
import json

class TicketPurchaseView(APIView):
    def post(self, request):
        serializer = TicketCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        sight_id = data['sight_id']
        guests = data['guests']
        user = request.user

        if not user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            sight = Sight.objects.get(id=sight_id)
        except Sight.DoesNotExist:
            return Response({"error": "Sight not found"}, status=status.HTTP_404_NOT_FOUND)

        tour_date = data.get('tour_date', timezone.now().date())
        is_weekend = tour_date.weekday() >= 5 # 5=Sat, 6=Sun

        total_amount = 0
        valid_guests = []

        # Calculate Price
        for guest in guests:
            citizen_id = guest.get('citizen')
            # 173 = Local (Uzbekistan)
            is_local = citizen_id == 173
            
            # Select correct price attribute
            if is_local:
                price = sight.is_weekend_local if is_weekend else sight.is_local
            else:
                price = sight.is_weekend_foreg if is_weekend else sight.is_foreg
            
            # Fallback if weekend price is 0 but weekday isn't
            if is_weekend and price == 0:
                price = sight.is_local if is_local else sight.is_foreg

            valid_guests.append({
                'name': guest['name'],
                'passport': guest['passport'],
                'citizen': citizen_id,
                'amount': float(price),
                'is_weekend': is_weekend
            })
            total_amount += price

        if not valid_guests:
            return Response({"error": "No valid guests"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Transaction
        try:
            with transaction.atomic():
                # Create Ticket (Order)
                ticket = Ticket.objects.create(
                    sight=sight,
                    vendor=sight.vendor,
                    created_by=user,
                    total_qty=len(valid_guests),
                    total_amount=total_amount,
                    is_paid=True, # Assuming immediate payment/mock
                    is_valid=True
                )

                # Create details
                for guest in valid_guests:
                    # Hash Generation (Mimic Laravel: json(guest) + ticketId + salt)
                    salt = 'ittopmaskuchukyurmassourcesalttuz' 
                    hash_source = json.dumps(guest, sort_keys=True) + str(ticket.id) + salt
                    hash_val = hashlib.md5(hash_source.encode()).hexdigest()
                    # Base64 Encode URL (Localhost for now)
                    # config('app.url') -> using relative for now or hardcoded 'http://localhost:8000'
                    ticket_hash = base64.b64encode(f"http://localhost:8000/check-ticket/{hash_val}".encode()).decode()

                    TicketDetail.objects.create(
                        ticket=ticket,
                        guest_name=guest['name'],
                        guest_info=guest,
                        amount=guest['amount'],
                        hash=ticket_hash,
                        # valid_until logic omitted for brevity (e.g. +1 month)
                        valid_until=timezone.now() + timezone.timedelta(days=30)
                    )

            return Response({
                "ticket_id": ticket.id,
                "total_amount": total_amount,
                "message": "Ticket successfully created"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoryListAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from .models import Category
        base_qs = Category.objects.filter(is_active=True)
        data = [{"id": c.id, "name": c.name, "image": c.photo} for c in base_qs]
        return Response(data)

from rest_framework import viewsets
from rest_framework.decorators import action
from .services.emehmon import EMehmonService
from .serializers import BookingSerializer, HotelSerializer
from .models import Booking, Hotel

class PersonInfoView(APIView):
    """
    API for checking Person Info via E-Mehmon service.
    """
    def post(self, request):
        passport = request.data.get('passport')
        birthday = request.data.get('birthday')
        citizen = request.data.get('citizen')
        client_hash = request.data.get('secret') # mimicking legacy naming

        if not all([passport, birthday, citizen]):
             return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        service = EMehmonService()
        result = service.check_person_info(passport, birthday, citizen, client_hash)

        if result['success']:
            return Response(result['data'])
        else:
            return Response({"error": result['message']}, status=result.get('code', 400))


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Hotel Bookings.
    Replicates legacy logic:
    - Create (Pending)
    - Check Availability
    - List/Retrieve (filtered by user)
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        # Guests see their own, vendors see bookings for their hotels?
        # For now unimplemented vendor logic, returning user's own bookings
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, booking_status='pending', payment_status='pending')

    @action(detail=False, methods=['POST'])
    def check_availability(self, request):
        """
        Check if rooms are available for given dates.
        Legacy logic used overlapping date checks.
        """
        hotel_id = request.data.get('hotel_id')
        check_in = request.data.get('check_in')
        check_out = request.data.get('check_out')
        # rooms_req = request.data.get('rooms', 1) 
        
        if not all([hotel_id, check_in, check_out]):
             return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        # Simplified Overlap Logic
        # (StartA <= EndB) and (EndA >= StartB)
        
        # Here we would count existing confirmed bookings for this hotel/room_type
        # For now, simplistic check or just pass (since legacy logic was commented out!)
        
        return Response({'available': True, 'message': 'Rooms available'})


class HotelCommentListCreateView(generics.ListCreateAPIView):
    """
    List and create hotel comments.
    GET: Returns all approved comments for a hotel.
    POST: Creates a new comment (authenticated users only).
    """
    serializer_class = HotelCommentSerializer
    
    def get_queryset(self):
        hotel_id = self.kwargs.get('hotel_id')
        sight_id = self.kwargs.get('sight_id')
        
        qs = HotelComment.objects.filter(status='approved').select_related('user').order_by('-created_at')
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        elif sight_id:
            qs = qs.filter(sight_id=sight_id)
            
        return qs
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        hotel_id = self.kwargs.get('hotel_id')
        sight_id = self.kwargs.get('sight_id')
        
        save_kwargs = {'user': self.request.user, 'status': 'pending'}
        if hotel_id:
            save_kwargs['hotel_id'] = hotel_id
        elif sight_id:
            save_kwargs['sight_id'] = sight_id
            
        serializer.save(**save_kwargs)


class HotelCommentStatsView(APIView):
    """
    Returns rating statistics for a hotel.
    GET /api/hotels/{hotel_id}/comments/stats/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, hotel_id=None, sight_id=None):
        if hotel_id:
            comments = HotelComment.objects.filter(hotel_id=hotel_id, status='approved')
        else:
            comments = HotelComment.objects.filter(sight_id=sight_id, status='approved')
        
        if not comments.exists():
            return Response({
                'avg_rating': 0,
                'total_reviews': 0,
                'rating_distribution': {str(i): 0 for i in range(1, 6)},
                'rating_percentages': {str(i): 0 for i in range(1, 6)}
            })
        
        avg_rating = comments.aggregate(Avg('rating'))['rating__avg']
        total_reviews = comments.count()
        
        # Count ratings 1-5
        rating_counts = {}
        for i in range(1, 6):
            rating_counts[str(i)] = comments.filter(rating=i).count()
        
        # Calculate percentages
        rating_percentages = {}
        for rating, count in rating_counts.items():
            rating_percentages[rating] = round((count / total_reviews) * 100) if total_reviews > 0 else 0
        
        return Response({
            'avg_rating': round(avg_rating, 1) if avg_rating else 0,
            'total_reviews': total_reviews,
            'rating_distribution': rating_counts,
            'rating_percentages': rating_percentages
        })


class GenerateCaptchaView(APIView):
    """
    Generate a new CAPTCHA for review forms.
    GET /api/hotels/captcha/generate/
    Returns: {"captcha_key": "abc123", "captcha_image_url": "/captcha/image/abc123/"}
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Generate new captcha
        captcha_key = CaptchaStore.generate_key()
        captcha_url = captcha_image_url(captcha_key)
        
        return Response({
            'captcha_key': captcha_key,
            'captcha_image_url': captcha_url
        })
