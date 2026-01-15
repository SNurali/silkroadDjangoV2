import requests
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from locations.models import Region
from hotels.models import Category, Sight, SightFacility, Ticket
from .forms import SightForm, TicketForm
from .serializers import SightSerializer, TicketSerializer


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


# ───────────────────────────────────────────────
#                   REST API (DRF)
# ───────────────────────────────────────────────

class SightListAPIView(APIView):
    """
    API — список достопримечательностей с фильтрами и пагинацией.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Sight.objects.filter(status='active').select_related(
            'vendor', 'category', 'vendor__region'
        ).prefetch_related('facilities')

        if category_id := request.query_params.get('category'):
            qs = qs.filter(category_id=category_id)
        if region_id := request.query_params.get('region'):
            qs = qs.filter(vendor__region_id=region_id)

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
    permission_classes = [IsAuthenticated]

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

        # Создаём билет
        ticket = Ticket.objects.create(
            sight=sight,
            vendor=sight.vendor,
            created_by=request.user,
            total_qty=total_qty,
            total_amount=sight.is_foreg * total_qty  # можно сделать логику по роли
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

        ticket = Ticket.objects.create(
            sight=sight,
            vendor=sight.vendor,
            created_by=request.user,
            total_qty=total_qty,
            total_amount=total_amount,
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

        except Exception as e:
            # Логирование здесь было бы идеально (logger.error(...))
            return Response({
                "detail": "Внутренняя ошибка при обработке оплаты"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)