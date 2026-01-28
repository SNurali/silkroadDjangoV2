from rest_framework import viewsets, permissions, status, views
from silkroad_backend.permissions import IsVendorOwner, IsVendorOperator, IsObjectOwner
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .models import Vendor, TicketSale
from .serializers import VendorDashboardSerializer, VendorHotelSerializer, VendorSightSerializer
from hotels.models import Hotel, Sight
from bookings.models import Booking

User = get_user_model()

class IsVendorUser(permissions.BasePermission):
    """
    Allows access only to authenticated users who have a Vendor profile.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, 'vendor_profile'))

class VendorDashboardView(views.APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        serializer = VendorDashboardSerializer(vendor)
        data = serializer.data

        from django.db.models import Sum
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        from datetime import timedelta
        from hotels.models import Hotel, Sight
        from bookings.models import Booking
        from vendors.models import TicketSale

        # Filter Logic
        days_param = request.query_params.get('days', '30')
        try:
            days = int(days_param)
        except ValueError:
            days = 30
            
        start_date = timezone.now() - timedelta(days=days)

        # --- ENHANCED STATS CALCULATION (Filtered) ---
        
        # 1. Ticket Revenue
        ticket_revenue = TicketSale.objects.filter(
            vendor=vendor,
            payment_status='paid',
            created_at__gte=start_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Booking Revenue
        booking_revenue = Booking.objects.filter(
            hotel__vendor=vendor,
            status='CONFIRMED',
            created_at__gte=start_date
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        total_revenue = ticket_revenue + booking_revenue
        
        # 2. Total Orders
        tickets_count = TicketSale.objects.filter(vendor=vendor, created_at__gte=start_date).count()
        bookings_count = Booking.objects.filter(hotel__vendor=vendor, created_at__gte=start_date).count()
        
        total_orders = tickets_count + bookings_count
        
        # 3. Total Customers
        ticket_customers = TicketSale.objects.filter(vendor=vendor, created_at__gte=start_date).count()
        total_customers = ticket_customers + bookings_count 

        # 4. Active Counts (Snapshot, not filtered by date)
        hotels_count = Hotel.objects.filter(vendor=vendor).count()
        tours_count = Sight.objects.filter(vendor=vendor).count()

        # Update stats in response
        data['stats'] = {
            'hotels': hotels_count,
            'tours': tours_count,
            'bookings_today': 0, 
            'total_bookings': total_orders,
            'total_customers': total_customers,
            'total_revenue': total_revenue
        }
        data['balance'] = total_revenue

        # --- CHART DATA ---
        
        # Tickets Daily
        daily_tickets = TicketDetail.objects.filter(
            ticket__vendor=vendor,
            ticket__is_paid=True, 
            created_at__gte=start_date
        ).annotate(date=TruncDate('created_at'))\
         .values('date')\
         .annotate(income=Sum('amount'))\
         .order_by('date')

        # Bookings Daily
        daily_bookings = Booking.objects.filter(
            hotel__vendor=vendor,
            status='CONFIRMED',
            created_at__gte=start_date
        ).annotate(date=TruncDate('created_at'))\
         .values('date')\
         .annotate(income=Sum('total_price'))\
         .order_by('date')

        # Merge Chart Data
        income_map = {}
        for entry in daily_tickets:
            d = entry['date'].strftime('%d %b')
            income_map[d] = income_map.get(d, 0) + entry['income']
            
        for entry in daily_bookings:
            d = entry['date'].strftime('%d %b')
            income_map[d] = income_map.get(d, 0) + entry['income']
            
        final_chart_dates = []
        final_chart_values = []
        
        # Generate date labels for range
        # If range is huge (365 days), we should group by Month. 
        # For simplicity, if days > 60, maybe simpler labels?
        # Let's keep daily for now but loop carefully
        
        step = 1
        loop_days = days
        if days > 60: 
             # Too many points? ApexCharts handles it, but labels might crowd.
             pass

        for i in range(loop_days):
            d_date = (timezone.now() - timedelta(days=(loop_days - 1) - i)).date()
            d_str = d_date.strftime('%d %b')
            final_chart_dates.append(d_str)
            final_chart_values.append(income_map.get(d_str, 0))

        data['chart_data'] = {
            'dates': final_chart_dates,
            'values': final_chart_values
        }

        # --- RECENT BOOKINGS (Filtered) ---
        recent_tickets = list(TicketSale.objects.filter(
            vendor=vendor, payment_status='paid', created_at__gte=start_date
        ).order_by('-created_at')[:5])
        
        recent_hotel_bookings = list(Booking.objects.filter(
            hotel__vendor=vendor, created_at__gte=start_date
        ).order_by('-created_at')[:5])
        
        combined = []
        for t in recent_tickets:
            combined.append({
                'id': f"T-{t.id}",
                'user': "Guest", # Simplified
                'service': "Tour",
                'amount': t.total_amount,
                'date': t.created_at,
                'status': 'Paid'
            })
            
        for b in recent_hotel_bookings:
            combined.append({
                'id': f"B-{b.id}",
                'user': "Guest",
                'service': b.hotel.name if b.hotel else "Hotel",
                'amount': b.total_price,
                'date': b.created_at,
                'status': b.status.capitalize()
            })
            
        combined.sort(key=lambda x: x['date'], reverse=True)
        data['recent_bookings'] = combined[:5]

        return Response(data)

class VendorSettingsView(views.APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        from .serializers import VendorSettingsSerializer
        serializer = VendorSettingsSerializer(vendor)
        return Response(serializer.data)
    
    def put(self, request):
        vendor = request.user.vendor_profile
        from .serializers import VendorSettingsSerializer
        serializer = VendorSettingsSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VendorSettingsView(views.APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        from .serializers import VendorSettingsSerializer
        serializer = VendorSettingsSerializer(vendor)
        return Response(serializer.data)
    
    def put(self, request):
        vendor = request.user.vendor_profile
        from .serializers import VendorSettingsSerializer
        serializer = VendorSettingsSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VendorHotelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsVendorOwner | IsVendorOperator]
    serializer_class = VendorHotelSerializer

    def get_queryset(self):
        # Filter by created_by to show only user's own items
        return Hotel.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor_profile, created_by=self.request.user)

class VendorSightViewSet(viewsets.ModelViewSet):
    permission_classes = [IsVendorOwner | IsVendorOperator]
    serializer_class = VendorSightSerializer

    def get_queryset(self):
        # Filter by created_by to show only user's own items
        return Sight.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor_profile, created_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='upload-image')
    def upload_image(self, request):
        """
        Uploads an image separately and returns the URL.
        Matches Laravel's postUploadImage.
        """
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple save to media/temp or just media/vendor_uploads
        # Using a model or just FileSystemStorage would work. 
        # For simplicity, let's use default storage mechanism if configured, or manual
        try:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import os
            
            # Create a unique path
            ext = image.name.split('.')[-1]
            filename = f"vendor_uploads/{request.user.id}/{image.name}" 
            
            # Save
            path = default_storage.save(filename, ContentFile(image.read()))
            
            # Return URL (assuming standard media setup)
            url = default_storage.url(path)
            
            return Response({'success': True, 'imageUrl': url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VendorBookingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Vendors to manage incoming bookings for their hotels.
    """
    permission_classes = [IsVendorOwner | IsVendorOperator]
    # We use BookingSerializer from hotels, or a specific VendorBookingSerializer?
    from bookings.serializers import BookingSerializer
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(hotel__vendor=self.request.user.vendor_profile).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'CONFIRMED':
             return Response({'detail': 'Already confirmed'}, status=status.HTTP_400_BAD_REQUEST)
             
        booking.status = 'CONFIRMED'
        
        # New Confirmation Fields
        from django.utils import timezone
        booking.confirmed_by = request.user
        booking.confirmed_at = timezone.now()
        
        booking.save()
        
        # Determine notification Link (User side)
        user_link = "/profile/bookings"
        
        # Notify User
        if booking.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=booking.user,
                title="Booking Confirmed",
                message=f"Your booking at {booking.hotel.name} has been confirmed!",
                type="success",
                link=user_link
            )
            
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'CANCELLED':
             return Response({'detail': 'Already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        # Require Reason
        reason = request.data.get('reason')
        if not reason:
            return Response({'error': 'Reason is required for rejection'}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'CANCELLED'
        booking.rejection_reason = reason
        
        from django.utils import timezone
        booking.confirmed_by = request.user
        booking.confirmed_at = timezone.now()
        
        booking.save()
        
        # Notify User
        if booking.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=booking.user,
                title="Booking Declined",
                message=f"Your booking at {booking.hotel.name} was declined. Reason: {reason}",
                type="danger",
                link="/profile/bookings"
            )
        
        return Response({'status': 'cancelled'})

class VendorTicketViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Vendors to manage incoming tour bookings (TicketSales).
    """
    permission_classes = [IsVendorOwner | IsVendorOperator]
    # serializer_class = TicketSaleSerializer # Needs implementation if needed
    
    def get_queryset(self):
        return TicketSale.objects.filter(vendor=self.request.user.vendor_profile).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        ticket = self.get_object()
        if ticket.booking_status == 'confirmed':
             return Response({'detail': 'Already confirmed'}, status=status.HTTP_400_BAD_REQUEST)
             
        ticket.booking_status = 'confirmed'
        ticket.is_valid = True
        
        from django.utils import timezone
        ticket.confirmed_at = timezone.now()
        ticket.confirmed_by = request.user
        
        ticket.save()
        
        # Notify User
        if ticket.created_by:
            from notifications.models import Notification
            Notification.objects.create(
                user=ticket.created_by,
                title="Tour Confirmed",
                message=f"Your tour '{ticket.sight.name}' has been confirmed! You can now download your voucher.",
                type="success",
                link="/profile/bookings"
            )
            
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == 'CANCELLED':
             return Response({'detail': 'Already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        # Require Reason
        reason = request.data.get('reason')
        if not reason:
            return Response({'error': 'Reason is required for rejection'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.status = 'CANCELLED'
        ticket.is_valid = False
        ticket.rejection_reason = reason
        
        from django.utils import timezone
        ticket.confirmed_at = timezone.now()
        ticket.confirmed_by = request.user
        
        ticket.save()
        
        # Notify User
        if ticket.created_by:
            from notifications.models import Notification
            Notification.objects.create(
                user=ticket.created_by,
                title="Tour Declined",
                message=f"Your tour '{ticket.sight.name}' was declined. Reason: {ticket.rejection_reason}",
                type="danger",
                link="/profile/bookings"
            )
        
        return Response({'status': 'cancelled'})

class VendorSwitchView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Check if user has a vendor profile
        if not hasattr(user, 'vendor_profile'):
            return Response(
                {'error': 'User does not have a vendor profile'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the vendor profile
        vendor = user.vendor_profile
        
        # Generate new JWT tokens with vendor role
        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'vendor'  # or 'vendor_op', 'hotel_admin'
        refresh['vendor_id'] = vendor.id
        refresh['vendor_name'] = vendor.name
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'vendor_id': vendor.id,
            'vendor_name': vendor.name,
            'vendor_role': vendor.vendor_type if hasattr(vendor, 'vendor_type') else 'vendor'
        })

class UserSwitchView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Generate new JWT tokens with user role
        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'user'
        refresh['vendor_id'] = None
        refresh['vendor_name'] = None
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'vendor_id': None,
            'vendor_name': None
        })
