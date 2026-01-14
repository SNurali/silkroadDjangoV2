from django.urls import path

from . import views

app_name = 'hotels'

urlpatterns = [
    path('', views.SightListView.as_view(), name='sight_list'),
    path('partial/', views.SightListView.as_view(), name='sight_partial_list'),  # для htmx
    path('<int:pk>/', views.SightDetailView.as_view(), name='sight_detail'),
]