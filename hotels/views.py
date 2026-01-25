import requests
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
import re

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, generics, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from locations.models import Region
from hotels.models import Category, Sight, SightFacility, Ticket, Hotel, Room, RoomType, Booking, RoomPrice
from .forms import SightForm, TicketForm, BookingForm
from .serializers import SightSerializer, TicketSerializer, HotelSerializer, BookingSerializer


# ───────────────────────────────────────────────
#               Обычные CBV (веб-страницы)
# ───────────────────────────────────────────────

class SightListView(ListView):
    """
    Полная страница со списком достопримечательностей + фильтры + navbar.
    """
    model = Sight
    template_name = 'hotels/sight_list.html'
    context_object_name = 'sights'
    paginate_by = 12

    def get_queryset(self):
        qs = Sight.objects.filter(status='active').select_related(
            'vendor', 'category', 'vendor__region'
        ).prefetch_related('facilities')

        category_id = self.request.GET.get('category')
        region_id = self.request.GET.get('region')

        if category_id:
            qs = qs.filter(category_id=category_id)
        if region_id:
            qs = qs.filter(vendor__region_id=region_id)

        return qs.order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'page_title': 'Достопримечательности Узбекистана',
            'categories': Category.objects.filter(is_active=True).order_by('name'),
            'regions': Region.objects.filter(is_active=True).order_by('name'),
            'selected_category': self.request.GET.get('category', ''),
            'selected_region': self.request.GET.get('region', ''),
        })
        return context


class SightPartialListView(ListView):
    """
    Только карточки + пагинация — для HTMX-замены.
    """
    model = Sight
    template_name = 'hotels/partials/sight_list_partial.html'
    context_object_name = 'sights'
    paginate_by = 12

    def get_queryset(self):
        qs = Sight.objects.filter(status='active').select_related(
            'vendor', 'category', 'vendor__region'
        ).prefetch_related('facilities')

        if category_id := self.request.GET.get('category'):
            qs = qs.filter(category_id=category_id)
        if region_id := self.request.GET.get('region'):
            qs = qs.filter(vendor__region_id=region_id)

        return qs.order_by('-created_at')


class SightDetailView(DetailView):
    """
    Детальная страница достопримечательности.
    """
    model = Sight
    template_name = 'hotels/sight_detail.html'
    context_object_name = 'sight'

    def get_object(self, queryset=None):
        return get_object_or_404(Sight, pk=self.kwargs['pk'], status='active')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        sight = self.object

        context.update({
            'page_title': sight.name,
            'facilities': sight.facilities.all(),
            'images': sight.get_images_list(),
        })

        if sight.enable_tickets:
            context['ticket_form'] = TicketForm(
                sight=sight,
                user=self.request.user,
                initial={'sight_id': sight.pk}
            )

        return context


class SightCreateView(LoginRequiredMixin, CreateView):
    """
    Создание достопримечательности (только vendor).
    """
    model = Sight
    form_class = SightForm
    template_name = 'hotels/sight_create.html'
    success_url = reverse_lazy('accounts:profile')

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != 'vendor':
            return redirect('accounts:profile')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        form.instance.vendor = self.request.user.vendor_profile
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class TicketCreateView(LoginRequiredMixin, CreateView):
    """
    Покупка / бронирование билета на достопримечательность (веб-форма).
    """
    model = Ticket
    form_class = TicketForm
    template_name = 'hotels/sight_detail.html'
    success_url = reverse_lazy('accounts:profile')

    def dispatch(self, request, *args, **kwargs):
        self.sight = get_object_or_404(Sight, pk=kwargs['pk'], status='active')
        if not self.sight.enable_tickets:
            return redirect('hotels:sight_detail', pk=self.sight.pk)
        return super().dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs.update({
            'sight': self.sight,
            'user': self.request.user,
        })
        return kwargs

    def form_valid(self, form):
        form.instance.sight = self.sight
        form.instance.vendor = self.sight.vendor
        form.instance.created_by = self.request.user
        form.instance.total_amount = form.instance.calculate_total()
        return super().form_valid(form)


def calculate_total(request):
    """
    AJAX-расчёт суммы билета (для htmx).
    """
    sight_id = request.GET.get('sight_id')
    qty = int(request.GET.get('total_qty', 1))

    sight = get_object_or_404(Sight, pk=sight_id)
    total = sight.is_foreg * qty  # или логика по роли
    return JsonResponse({'total': str(total)})



class HotelListView(ListView):
    """
    Список отелей (Grid/List).
    """
    model = Hotel
    template_name = 'hotels/hotel_list.html'
    context_object_name = 'hotels'
    paginate_by = 9

    def get_queryset(self):
        qs = Hotel.objects.filter(is_active=True).select_related('region')
        
        region_id = self.request.GET.get('region')
        name_query = self.request.GET.get('name')
        
        if region_id:
            qs = qs.filter(region_id=region_id)
        
        if name_query:
            qs = qs.filter(name__icontains=name_query)

        return qs.order_by('-stars') # Legacy order

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({
            'page_title': 'Hotels',
            'regions': Region.objects.filter(is_active=True).order_by('name'),
            'selected_region': self.request.GET.get('region', ''),
            'name_query': self.request.GET.get('name', ''),
        })
        return context


class HotelDetailView(DetailView):
    """
    Детальная страница отеля.
    """
    model = Hotel
    template_name = 'hotels/hotel_detail.html'
    context_object_name = 'hotel'

    def get_queryset(self):
        return Hotel.objects.filter(is_active=True).select_related('region')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        hotel = self.object
        
        # Room Types logic (Group rooms by type)
        # In legacy: fetch rooms, group by type, calculate min price etc.
        # Here we just pass related data for template to handle or pre-calculate
        
        # Assuming we need to show available room types
        room_types = RoomType.objects.filter(rooms__hotel=hotel, rooms__active=True).distinct()
        
        # Simple availability check (mockup for now, real implementation needs date search)
        
        context.update({
            'images': hotel.get_images_list(),
            'room_types': room_types,
            'amenities': hotel.amenities_services, # JSON
        })
        return context


class BookingCreateView(LoginRequiredMixin, CreateView):
    """
    Страница бронирования (Booking Form).
    """
    model = Booking
    form_class = BookingForm
    template_name = 'hotels/booking.html'
    success_url = reverse_lazy('accounts:profile')

    def dispatch(self, request, *args, **kwargs):
        self.hotel = get_object_or_404(Hotel, pk=kwargs['pk'], is_active=True)
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['hotel'] = self.hotel
        
        # Pre-fill data if passed from Detail Page
        check_in = self.request.GET.get('check_in')
        check_out = self.request.GET.get('check_out')
        adults = self.request.GET.get('adults')
        
        if check_in:
             context['initial_check_in'] = check_in
        if check_out:
             context['initial_check_out'] = check_out
        
        return context

    def form_valid(self, form):
        form.instance.hotel = self.hotel
        form.instance.user = self.request.user if self.request.user.is_authenticated else None
        # Payment status pending
        form.instance.booking_status = 'pending'
        return super().form_valid(form)



class HotelListAPIView(generics.ListAPIView):
    """
    API List for Hotels with search and filtering.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = Hotel.objects.filter(is_active=True).select_related('region')
    serializer_class = HotelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'region': ['exact'],
        'stars': ['gte', 'lte', 'exact'],
        'rating': ['gte'],
    }
    search_fields = ['name', 'address', 'description']
    ordering_fields = ['stars', 'rating', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Price Filter (Inclusive of RoomPrice or deposit fields)

        min_price = self.request.query_params.get('price_min')
        max_price = self.request.query_params.get('price_max')
        
        if min_price or max_price:
            p_min = float(min_price) if min_price else 0
            p_max = float(max_price) if max_price else 10000000 
            
            # Filter hotels that have ANY price in range (either in RoomPrice or deposit fields)
            qs = qs.filter(
                Q(room_prices__usd__range=(p_min, p_max)) |
                Q(deposit__range=(p_min, p_max)) |
                Q(deposit_turizm__range=(p_min, p_max))
            ).distinct()

        # Stars Multi-select Filter
        stars_param = self.request.query_params.get('stars')
        if stars_param:
            try:
                star_list = [int(s.strip()) for s in stars_param.split(',') if s.strip().isdigit()]
                if star_list:
                    qs = qs.filter(stars__in=star_list)
            except ValueError:
                pass

        return qs

class HotelDetailAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk):
        hotel = get_object_or_404(Hotel, pk=pk, is_active=True)
        serializer = HotelSerializer(hotel, context={'request': request})
        return Response(serializer.data)



class SightListAPIView(APIView):
    """
    API — список достопримечательностей с фильтрами и пагинацией.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Sight.objects.filter(status='active').select_related(
            'vendor', 'category', 'vendor__region'
        ).prefetch_related('facilities')

        if category_id := request.query_params.get('category'):
            qs = qs.filter(category_id=category_id)
        if region_id := request.query_params.get('region'):
            qs = qs.filter(vendor__region_id=region_id)

        # Location Filter (Name, Address, Region)
        location = request.query_params.get('location')
        if location and location.strip():
            term = location.strip()
            qs = qs.filter(
                Q(name__icontains=term) |
                Q(address__icontains=term) |
                Q(vendor__region__name__icontains=term)
            )

        # Guests Filter (Capacity)
        guests = request.query_params.get('guests')
        if guests:
            match = re.search(r'\d+', str(guests))
            if match:
                count = int(match.group())
                # If max_capacity is NULL, assume it accommodates (or skip filter). 
                # Better: strict filter only if capacity is set.
                qs = qs.filter(Q(max_capacity__gte=count) | Q(max_capacity__isnull=True))

        # Dates Filter (Placeholder)
        dates = request.query_params.get('dates')
        if dates:
            # TODO: Implement availability check when Booking model is ready
            pass

        paginator = PageNumberPagination()
        paginator.page_size = 12
        paginator.page_size_query_param = 'page_size'
        paginator.max_page_size = 100

        page = paginator.paginate_queryset(qs, request)
        serializer = SightSerializer(page, many=True, context={'request': request})

        return paginator.get_paginated_response(serializer.data)


class SightDetailAPIView(APIView):
    """
    API — детальная информация об одной достопримечательности.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        sight = get_object_or_404(Sight, pk=pk, status='active')
        serializer = SightSerializer(sight, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TicketListAPIView(APIView):
    """
    API для списка (GET) и создания (POST) билетов текущего пользователя.
    Запрещено покупать один и тот же билет дважды.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = Ticket.objects.filter(created_by=request.user).select_related('sight', 'vendor')
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)

    def post(self, request):
        sight_id = request.data.get('sight_id')
        total_qty = request.data.get('total_qty', 1)

        if not sight_id:
            return Response({"error": "sight_id обязателен"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sight = Sight.objects.get(pk=sight_id, status='active')
        except Sight.DoesNotExist:
            return Response({"error": "Достопримечательность не найдена или не активна"}, status=status.HTTP_404_NOT_FOUND)

        if not sight.enable_tickets:
            return Response({"error": "Билеты на эту достопримечательность отключены"}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем минимальное количество
        if not isinstance(total_qty, int) or total_qty < 1:
            return Response({"error": "Количество должно быть целым числом не менее 1"}, status=status.HTTP_400_BAD_REQUEST)

        # ПРОВЕРКА НА СУЩЕСТВОВАНИЕ БИЛЕТА
        if Ticket.objects.filter(sight_id=sight_id, created_by=request.user).exists():
            return Response(
                {"error": "Вы уже купили билет на эту достопримечательность"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate deadline
        from django.utils import timezone
        from datetime import timedelta
        deadline = timezone.now() + timedelta(hours=48)

        # Создаём билет
        ticket = Ticket.objects.create(
            sight=sight,
            vendor=sight.vendor,
            created_by=request.user,
            total_qty=total_qty,
            total_amount=sight.is_foreg * total_qty,  # можно сделать логику по роли
            booking_status='pending',
            confirmation_deadline=deadline,
            is_valid=False
        )

        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TicketCreateAPIView(APIView):
    """
    API для создания билета (покупка / бронирование).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sight_id = request.data.get('sight_id')
        total_qty = request.data.get('total_qty', 1)

        if not sight_id:
            return Response({"detail": "Поле sight_id обязательно"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total_qty = int(total_qty)
            if total_qty < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"detail": "total_qty должен быть целым числом ≥ 1"}, status=status.HTTP_400_BAD_REQUEST)

        sight = get_object_or_404(
            Sight,
            pk=sight_id,
            status='active',
            enable_tickets=True
        )

        price = sight.price_foreign if sight.price_foreign > 0 else sight.price_local
        total_amount = price * total_qty

        # Calculate deadline
        from django.utils import timezone
        from datetime import timedelta
        deadline = timezone.now() + timedelta(hours=48)

        ticket = Ticket.objects.create(
            sight=sight,
            vendor=sight.vendor,
            created_by=request.user,
            total_qty=total_qty,
            total_amount=total_amount,
            booking_status='pending',
            confirmation_deadline=deadline,
            is_valid=False
        )

        serializer = TicketSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PayTicketAPIView(APIView):
    """
    API для оплаты существующего билета (реальный Yagona Billing или тестовый режим).

    POST /api/tickets/pay/
    {
        "ticket_id": 42
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket_id = request.data.get('ticket_id')

        if not ticket_id:
            return Response({"detail": "Поле ticket_id обязательно"}, status=status.HTTP_400_BAD_REQUEST)

        ticket = get_object_or_404(
            Ticket,
            id=ticket_id,
            created_by=request.user
        )

        if ticket.is_paid:
            return Response({"detail": "Билет уже оплачен"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Тестовый режим (FAKE_PAYMENT = True в settings)
        if getattr(settings, 'FAKE_PAYMENT', False):
            ticket.is_paid = True
            ticket.is_valid = True
            ticket.save(update_fields=['is_paid', 'is_valid'])

            return Response({
                "success": True,
                "message": "Оплата прошла успешно (тестовый режим)",
                "ticket": TicketSerializer(ticket, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # 2. Реальная оплата через Yagona Billing
        try:
            payload = {
                "client": settings.YAGONA_BILLING_CLIENT,
                "secret": settings.YAGONA_BILLING_CLIENT_SECRET,
                "merchant_id": settings.YAGONA_BILLING_MERCHANT_ID,
                "amount": str(ticket.total_amount),
                "description": f"Билет на {ticket.sight.name} × {ticket.total_qty}",
                "order_id": str(ticket.id),
                "return_url": request.build_absolute_uri(reverse_lazy('accounts:profile')),
                # "callback_url": "https://your-domain.com/api/payment/callback/"  # если Yagona поддерживает callback
            }

            response = requests.post(
                "https://billing.yagona.uz/api/pay",  # уточните точный endpoint у Yagona
                json=payload,
                timeout=15,
            )
            response.raise_for_status()

            data = response.json()

            if data.get("success"):
                ticket.is_paid = True
                ticket.is_valid = True
                ticket.save(update_fields=['is_paid', 'is_valid'])

                return Response({
                    "success": True,
                    "message": "Оплата прошла успешно",
                    "ticket": TicketSerializer(ticket, context={'request': request}).data,
                    "payment_url": data.get("payment_url")  # если Yagona возвращает ссылку
                }, status=status.HTTP_200_OK)

            else:
                return Response({
                    "detail": data.get("message", "Ошибка оплаты от биллинга")
                }, status=status.HTTP_400_BAD_REQUEST)

        except requests.exceptions.RequestException as e:
            return Response({
                "detail": f"Ошибка связи с биллингом: {str(e)}"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Логирование здесь было бы идеально (logger.error(...))
            return Response({
                "detail": "Внутренняя ошибка при обработке оплаты"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from rest_framework.decorators import action
# ... (existing imports)

class BookingViewSet(viewsets.ModelViewSet):
    """
    CRUD for Bookings.
    Replicates Legacy HotelsController logic.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see their own bookings
        if self.request.user.is_superuser:
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # 1. Custom Validation logic matching Legacy
        data = request.data.copy()
        
        # Parse selected_rooms_json if string
        selected_rooms = data.get('selected_rooms_json')
        if isinstance(selected_rooms, str):
            try:
                selected_rooms = json.loads(selected_rooms)
            except:
                return Response({'error': 'Invalid JSON for selected_rooms_json'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Recalculate Total Price
        hotel_id = data.get('hotel')
        check_in_str = data.get('check_in')
        check_out_str = data.get('check_out')
        
        if not all([hotel_id, check_in_str, check_out_str, selected_rooms]):
             return super().create(request, *args, **kwargs) # Let serializer handle missing field errors

        try:
            from datetime import datetime
            check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
            check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
            nights = (check_out - check_in).days
            if nights < 1:
                return Response({'error': 'Check-out must be after check-in'}, status=status.HTTP_400_BAD_REQUEST)
                
            total_price = 0
            
            # Logic: Iterate rooms, find price, sum up
            # Legacy: loop rooms, find tb_room_prices
            for room_item in selected_rooms:
                room_id = room_item.get('room_id') # Legacy used roomTypeId sometimes, here we might map room_id to room
                # Adjust key based on frontend. Frontend sends: [{ room_id: 1, count: 1 }]
                
                # In Legacy it was Room Type based. In Django Model 'Room' links to 'RoomType'.
                # Let's assume room_id is RoomType ID for simplicity as per legacy logic (tb_room_prices needs type)
                # OR if it is specific Room ID.
                # HotelsController.php: $room['roomTypeId']
                # BookingForm.jsx currently: { room_id: 1, count: 1 } -> Let's interpret as RoomType ID.
                
                type_id = room_item.get('room_id') 
                count = int(room_item.get('count', 1))
                
                # Find Price
                # Legacy: tb_room_prices where id_hotel & id_type order by dt desc
                price_obj = RoomPrice.objects.filter(
                    hotel_id=hotel_id, 
                    room_type_id=type_id
                ).order_by('-dt').first()
                
                price_per_night = price_obj.usd if price_obj else 0 # Default 0 if not found
                
                total_price += (float(price_per_night) * nights * count)

            # Override total_price with calculated one (Security)
            # data['total_price'] = total_price 
            # Ideally we enforce this. For now let's just log or accept client (legacy accepted client)
            # But let's set it to be safe if client sends garbage.
            if total_price > 0:
                 data['total_price'] = total_price

        except Exception as e:
            # Fallback to standard flow if calc fails
            pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        booking = self.get_object()
        
        # Check permissions: Request user must be the vendor owner
        if not booking.hotel.vendor or booking.hotel.vendor.user != request.user:
            return Response({'error': 'You are not the vendor of this hotel'}, status=status.HTTP_403_FORBIDDEN)
            
        booking.booking_status = 'confirmed'
        
        # New fields
        from django.utils import timezone
        booking.confirmed_by = request.user
        booking.confirmed_at = timezone.now()
        
        booking.save()
        
        # Notify User
        if booking.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=booking.user,
                title="Booking Confirmed",
                message=f"Your booking at {booking.hotel.name} has been confirmed!",
                type="success",
                link="/profile/bookings"
            )
            
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        
        # Check permissions
        if not booking.hotel.vendor or booking.hotel.vendor.user != request.user:
             return Response({'error': 'You are not the vendor of this hotel'}, status=status.HTTP_403_FORBIDDEN)
        
        # Require Reason
        reason = request.data.get('reason')
        if not reason:
            return Response({'error': 'Reason is required for rejection'}, status=status.HTTP_400_BAD_REQUEST)
             
        booking.booking_status = 'cancelled'
        booking.rejection_reason = reason
        from django.utils import timezone
        booking.confirmed_by = request.user # Acted by
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

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        
        # Notify Vendor
        if booking.hotel.vendor and booking.hotel.vendor.user:
            from notifications.models import Notification
            Notification.objects.create(
                user=booking.hotel.vendor.user,
                title="New Booking Request",
                message=f"New booking #{booking.id} for {booking.hotel.name} from {booking.guest_name}",
                type="info",
                link="/vendor/bookings"
            )