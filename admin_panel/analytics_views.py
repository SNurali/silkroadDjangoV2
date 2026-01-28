from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from analytics.schema import get_client
from django.utils import timezone
from datetime import timedelta

@staff_member_required
def analytics_dashboard(request):
    """
    Renders the Analytics Dashboard page.
    """
    return render(request, 'admin/analytics/dashboard.html')

@staff_member_required
def analytics_data(request):
    """
    API endpoint for analytics charts.
    """
    client = get_client()
    period = request.GET.get('period', '30d')
    
    # 1. Total GMV (Last 30 days)
    gmv_query = "SELECT sum(amount) FROM booking_events WHERE event_time >= now() - INTERVAL 30 DAY"
    gmv = client.execute(gmv_query)[0][0] or 0
    
    # 2. Bookings by Region
    region_query = "SELECT region, count() as count FROM booking_events GROUP BY region ORDER BY count DESC LIMIT 5"
    regions = client.execute(region_query)
    
    # 3. Daily Revenue (Last 14 days)
    revenue_query = '''
        SELECT toDate(event_time) as date, sum(amount) as revenue 
        FROM booking_events 
        WHERE event_time >= now() - INTERVAL 14 DAY 
        GROUP BY date 
        ORDER BY date ASC
    '''
    revenue_daily = client.execute(revenue_query)
    
    return JsonResponse({
        'gmv': float(gmv),
        'regions': {r[0]: r[1] for r in regions},
        'revenue_daily': {str(r[0]): float(r[1]) for r in revenue_daily}
    })

@staff_member_required
def financial_report_view(request):
    """
    Renders the Financial Reporting page.
    """
    return render(request, 'admin/analytics/finance.html')

@staff_member_required
def financial_data(request):
    """
    API endpoint for financial reports.
    """
    client = get_client()
    
    # 1. Total Platform Commission (Assuming 10% for MVP)
    commission_query = "SELECT sum(amount) * 0.1 FROM booking_events WHERE status = 'confirmed'"
    platform_revenue = client.execute(commission_query)[0][0] or 0
    
    # 2. Revenue by Vendor
    vendor_revenue_query = '''
        SELECT vendor_id, sum(amount) as total
        FROM booking_events
        WHERE status = 'confirmed'
        GROUP BY vendor_id
        ORDER BY total DESC
        LIMIT 10
    '''
    vendor_revenue = client.execute(vendor_revenue_query)
    
    return JsonResponse({
        'platform_revenue': float(platform_revenue),
        'vendor_revenue': {r[0]: float(r[1]) for r in vendor_revenue}
    })
