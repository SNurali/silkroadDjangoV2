from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Vendor, VendorService, ServiceTicket, TicketSale
from .serializers_vendor import (
    VendorServiceSerializer, ServiceTicketSerializer, 
    TicketSaleSerializer, VendorDashboardStatsSerializer
)
from .permissions import (
    IsVendorOwner, IsVendorOperator, 
    CanManageServices, CanSellTickets, CanManageVendorSettings
)


class VendorDashboardStatsView(APIView):
    """
    Dashboard statistics for VENDOR and VENDOR_OPERATOR.
    Shows sales analytics, active services, and recent ticket sales.
    """
    permission_classes = [IsVendorOperator]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
        except AttributeError:
            return Response(
                {'error': 'Vendor profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Calculate stats
        total_services = VendorService.objects.filter(vendor=vendor, is_active=True).count()
        total_tickets_sold = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor
        ).count()
        
        total_revenue = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor,
            status='PAID'
        ).aggregate(total=Sum('price_paid'))['total'] or 0

        # Recent sales (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_sales = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor,
            purchase_date__gte=thirty_days_ago
        ).select_related('ticket_type__service', 'user').order_by('-purchase_date')[:10]

        # Top services by revenue
        top_services = VendorService.objects.filter(
            vendor=vendor
        ).annotate(
            revenue=Sum('ticket_types__sales__price_paid', filter=Q(ticket_types__sales__status='PAID'))
        ).order_by('-revenue')[:5]

        data = {
            'total_services': total_services,
            'total_tickets_sold': total_tickets_sold,
            'total_revenue': float(total_revenue),
            'recent_sales': TicketSaleSerializer(recent_sales, many=True).data,
            'top_services': VendorServiceSerializer(top_services, many=True).data,
            'vendor_role': vendor.operator_role,
        }

        return Response(data)


class VendorServiceListCreateView(generics.ListCreateAPIView):
    """
    List all services or create a new service.
    Both VENDOR and VENDOR_OPERATOR can access.
    """
    serializer_class = VendorServiceSerializer
    permission_classes = [CanManageServices]

    def get_queryset(self):
        return VendorService.objects.filter(
            vendor=self.request.user.vendor_profile
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor_profile)


class VendorServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a service.
    Only VENDOR (owner) can delete.
    """
    serializer_class = VendorServiceSerializer
    permission_classes = [IsVendorOperator]

    def get_queryset(self):
        return VendorService.objects.filter(
            vendor=self.request.user.vendor_profile
        )

    def destroy(self, request, *args, **kwargs):
        # Only VENDOR (owner) can delete services
        if request.user.vendor_profile.operator_role != 'vendor':
            return Response(
                {'error': 'Only vendor owner can delete services'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ServiceTicketListCreateView(generics.ListCreateAPIView):
    """
    List all tickets for a service or create a new ticket type.
    """
    serializer_class = ServiceTicketSerializer
    permission_classes = [CanManageServices]

    def get_queryset(self):
        service_id = self.kwargs.get('service_id')
        return ServiceTicket.objects.filter(
            service_id=service_id,
            service__vendor=self.request.user.vendor_profile
        )

    def perform_create(self, serializer):
        service_id = self.kwargs.get('service_id')
        service = VendorService.objects.get(
            id=service_id,
            vendor=self.request.user.vendor_profile
        )
        serializer.save(service=service)


class TicketSaleListView(generics.ListAPIView):
    """
    List all ticket sales for the vendor.
    """
    serializer_class = TicketSaleSerializer
    permission_classes = [IsVendorOperator]

    def get_queryset(self):
        return TicketSale.objects.filter(
            ticket_type__service__vendor=self.request.user.vendor_profile
        ).select_related('ticket_type__service', 'user').order_by('-purchase_date')


class SalesAnalyticsView(APIView):
    """
    Detailed sales analytics with charts and reports.
    """
    permission_classes = [IsVendorOperator]

    def get(self, request):
        vendor = request.user.vendor_profile
        period = request.query_params.get('period', '30')  # days
        
        try:
            days = int(period)
        except ValueError:
            days = 30

        start_date = timezone.now() - timedelta(days=days)

        # Daily sales chart
        daily_sales = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor,
            purchase_date__gte=start_date,
            status='PAID'
        ).extra(
            select={'day': 'DATE(purchase_date)'}
        ).values('day').annotate(
            revenue=Sum('price_paid'),
            count=Count('id')
        ).order_by('day')

        # Sales by service
        sales_by_service = VendorService.objects.filter(
            vendor=vendor
        ).annotate(
            total_sales=Count('ticket_types__sales', filter=Q(ticket_types__sales__status='PAID')),
            total_revenue=Sum('ticket_types__sales__price_paid', filter=Q(ticket_types__sales__status='PAID'))
        ).order_by('-total_revenue')

        # Conversion rate (if we track views)
        total_tickets = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor
        ).count()
        paid_tickets = TicketSale.objects.filter(
            ticket_type__service__vendor=vendor,
            status='PAID'
        ).count()
        
        conversion_rate = (paid_tickets / total_tickets * 100) if total_tickets > 0 else 0

        data = {
            'daily_sales': list(daily_sales),
            'sales_by_service': VendorServiceSerializer(sales_by_service, many=True).data,
            'conversion_rate': round(conversion_rate, 2),
            'total_revenue': sum(item['revenue'] or 0 for item in daily_sales),
            'total_tickets_sold': sum(item['count'] for item in daily_sales),
        }

        return Response(data)
