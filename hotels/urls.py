from django.urls import path

from . import views

app_name = 'hotels'

urlpatterns = [
    path('', views.SightListView.as_view(), name='sight_list'),
    path('partial/', views.SightListView.as_view(), name='sight_partial_list'),
    path('<int:pk>/', views.SightDetailView.as_view(), name='sight_detail'),
    path('create/', views.SightCreateView.as_view(), name='sight_create'),
    path('<int:pk>/buy-ticket/', views.TicketCreateView.as_view(), name='ticket_buy'),

    # API
    path('api/sights/', views.SightListAPIView.as_view(), name='api_sight_list'),
    path('api/sights/<int:pk>/', views.SightDetailAPIView.as_view(), name='api_sight_detail'),
    path('api/tickets/', views.TicketListAPIView.as_view(), name='api_ticket_list'),  # GET + POST
    path('hotels/calculate-total/', views.calculate_total, name='calculate_total'),  # для htmx
]