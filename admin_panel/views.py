"""
Admin Panel Views for Django SilkRoad Platform
Implements Laravel-like admin functionality
"""

from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Count, Sum, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from hotels.models import Sight, HotelComment
from bookings.models import Booking
from vendors.models import TicketSale, Vendor
from django.contrib.auth.decorators import login_required
import calendar


@login_required
def admin_dashboard(request):
    """
    Admin Dashboard - mirrors Laravel admin dashboard
    GET /admin/dashboard/
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Get counts
    sights_count = Sight.objects.count()
    total_income_tickets = TicketSale.objects.filter(status='PAID')\
        .aggregate(total=Sum('price_paid'))['total'] or 0
    total_income_bookings = Booking.objects.filter(status='CONFIRMED')\
        .aggregate(total=Sum('total_price'))['total'] or 0
    total_income = total_income_tickets + total_income_bookings
    
    vendors_count = Vendor.objects.count()
    total_tickets = TicketSale.objects.count()
    
    # Get popular services (top 4 by ticket count)
    popular_services = Sight.objects.annotate(
        ticket_count=Count('ticketsales') # Using related_name if defined, or TicketSale.objects.filter(sight=...)
    ).order_by('-ticket_count')[:4]
    
    # Ticket stats (paid vs unpaid)
    ticket_stats = TicketSale.objects.aggregate(
        paid=Count('id', filter=Case(When(status='PAID', then=1))),
        unpaid=Count('id', filter=Case(When(status='NEW', then=1)))
    )
    
    paid_tickets = ticket_stats['paid'] or 0
    unpaid_tickets = ticket_stats['unpaid'] or 0
    
    # Weekly ticket data by local/foreign
    start_of_week = timezone.now() - timedelta(days=timezone.now().weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    # Simplified weekly data using TicketSale
    weekly_data = TicketSale.objects.filter(
        purchase_date__date__range=[start_of_week.date(), end_of_week.date()]
    ).values('purchase_date__week_day').annotate(
        count=Count('id')
    )
    
    # Prepare weekly series data
    traffic_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    local_series = []
    foreign_series = []
    
    for day in range(1, 8):  # Monday is 1, Sunday is 7 in Django
        day_data = weekly_data.filter(created_at__week_day=day).first()
        local_series.append(day_data['local_count'] if day_data else 0)
        foreign_series.append(day_data['foreign_count'] if day_data else 0)
    
    # Recent reviews
    recent_reviews = HotelComment.objects.select_related('user', 'hotel').order_by('-created_at')[:5]
    
    # Recent tickets
    recent_tickets = TicketSale.objects.select_related('user', 'ticket_type__service').order_by('-purchase_date')[:5]
    
    # Recent bookings
    recent_bookings = Booking.objects.select_related('user', 'hotel').order_by('-created_at')[:5]
    
    context = {
        'sights_count': sights_count,
        'total_income': total_income,
        'vendors_count': vendors_count,
        'total_tickets': total_tickets,
        'popular_services': popular_services,
        'ticket_data': {
            'labels': ['Paid', 'Unpaid'],
            'series': [paid_tickets, unpaid_tickets],
        },
        'local_series': local_series,
        'foreign_series': foreign_series,
        'traffic_days': traffic_days,
        'local_series_total': sum(local_series),
        'foreign_series_total': sum(foreign_series),
        'recent_reviews': recent_reviews,
        'recent_tickets': recent_tickets,
        'recent_bookings': recent_bookings,
    }
    
    return render(request, 'admin/dashboard.html', context)


@login_required
def admin_vendors_list(request):
    """
    Admin Vendors List - mirrors Laravel admin vendor index
    GET /admin/vendors/
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Join vendors with regions and count sights
    vendors = Vendor.objects.select_related('region').annotate(
        sights_count=Count('sights')
    ).order_by('-created_at')
    
    context = {
        'vendors': vendors,
    }
    
    return render(request, 'admin/vendors/list.html', context)


@login_required
def admin_vendor_detail(request, vendor_id):
    """
    Admin Vendor Detail - mirrors Laravel admin vendor show
    GET /admin/vendors/<int:vendor_id>/
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    try:
        vendor = Vendor.objects.prefetch_related('sights').get(id=vendor_id)
        
        # Get vendor stats
        service_count = vendor.sights.count()
        total_tickets = TicketSale.objects.filter(vendor=vendor).count()
        total_revenue = TicketSale.objects.filter(
            vendor=vendor, 
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        context = {
            'vendor': vendor,
            'sights': vendor.sights.all(),
            'service_count': service_count,
            'total_tickets': total_tickets,
            'total_revenue': total_revenue,
        }
        
        return render(request, 'admin/vendors/detail.html', context)
    except Vendor.DoesNotExist:
        return JsonResponse({'error': 'Vendor not found'}, status=404)


@login_required
def admin_vendor_create(request):
    """
    Admin Vendor Create - mirrors Laravel admin vendor create
    GET /admin/vendors/create/ - Show form
    POST /admin/vendors/create/ - Create vendor
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    from locations.models import Region, District
    from hotels.models import Category
    from django.contrib.auth.models import User as DjangoUser
    
    if request.method == 'POST':
        # Process form data
        vendor_data = {
            'name': request.POST.get('name'),
            'category_id': request.POST.get('category_id'),
            'region_id': request.POST.get('region_id'),
            'district_id': request.POST.get('district_id'),
            'user_id': request.POST.get('user_id'),
            'address': request.POST.get('address'),
            'is_active': request.POST.get('is_active') == 'on',
        }
        
        # Handle photo upload
        if request.FILES.get('photo'):
            # In Django, we'd typically save this to MEDIA_ROOT
            # For now, just store the filename
            vendor_data['photo'] = request.FILES['photo'].name
        
        # Create vendor
        vendor = Vendor.objects.create(
            name=vendor_data['name'],
            category_id=vendor_data['category_id'],
            region_id=vendor_data['region_id'],
            district_id=vendor_data['district_id'],
            user_id=vendor_data['user_id'],
            address=vendor_data['address'],
            is_active=vendor_data['is_active'],
            photo=vendor_data.get('photo'),
            entry_by=request.user
        )
        
        return JsonResponse({'success': True, 'vendor_id': vendor.id})
    
    # GET request - show form
    users = DjangoUser.objects.filter(
        vendor_profile__isnull=True
    ).exclude(role='vendor')  # Get users not already assigned as vendors
    regions = Region.objects.all()
    districts = District.objects.all()
    categories = Category.objects.all()
    
    context = {
        'users': users,
        'regions': regions,
        'districts': districts,
        'categories': categories,
    }
    
    return render(request, 'admin/vendors/create.html', context)


@login_required
def admin_vendor_edit(request, vendor_id):
    """
    Admin Vendor Edit - mirrors Laravel admin vendor edit
    GET /admin/vendors/<int:vendor_id>/edit/ - Show form
    POST /admin/vendors/<int:vendor_id>/edit/ - Update vendor
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    from locations.models import Region, District
    from hotels.models import Category
    from django.contrib.auth.models import User as DjangoUser
    
    try:
        vendor = Vendor.objects.get(id=vendor_id)
    except Vendor.DoesNotExist:
        return JsonResponse({'error': 'Vendor not found'}, status=404)
    
    if request.method == 'POST':
        # Update vendor data
        vendor.name = request.POST.get('name')
        vendor.category_id = request.POST.get('category_id')
        vendor.region_id = request.POST.get('region_id')
        vendor.district_id = request.POST.get('district_id')
        vendor.address = request.POST.get('address')
        vendor.is_active = request.POST.get('is_active') == 'on'
        
        # Handle photo upload
        if request.FILES.get('photo'):
            vendor.photo = request.FILES['photo'].name
        
        vendor.save()
        
        # Update user-vendor association
        user_id = request.POST.get('user_id')
        if user_id:
            # Clear previous associations
            DjangoUser.objects.filter(vendor_profile=vendor).update(vendor_profile=None)
            # Set new association
            user = DjangoUser.objects.get(id=user_id)
            user.vendor_profile = vendor
            user.save()
        
        return JsonResponse({'success': True})
    
    # GET request - show form
    users = DjangoUser.objects.filter(
        vendor_profile__isnull=True
    ).exclude(role='vendor').union(DjangoUser.objects.filter(vendor_profile=vendor))
    
    regions = Region.objects.all()
    districts = District.objects.all()
    categories = Category.objects.all()
    
    context = {
        'vendor': vendor,
        'users': users,
        'regions': regions,
        'districts': districts,
        'categories': categories,
    }
    
    return render(request, 'admin/vendors/edit.html', context)


@login_required
def admin_vendor_delete(request, vendor_id):
    """
    Admin Vendor Delete - mirrors Laravel admin vendor delete
    DELETE /admin/vendors/<int:vendor_id>/ - Delete vendor
    """
    if not request.user.is_staff and not request.user.is_superuser:
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        vendor = Vendor.objects.get(id=vendor_id)
    except Vendor.DoesNotExist:
        return JsonResponse({'error': 'Vendor not found'}, status=404)
    
    # Check if vendor has associated tickets
    if TicketSale.objects.filter(vendor=vendor).exists():
        return JsonResponse({'error': 'Cannot delete vendor with existing tickets.'}, status=400)
    
    # Clear user associations
    from django.contrib.auth.models import User as DjangoUser
    DjangoUser.objects.filter(vendor_profile=vendor).update(vendor_profile=None)
    
    # Delete vendor
    vendor.delete()
    
    return JsonResponse({'success': True})