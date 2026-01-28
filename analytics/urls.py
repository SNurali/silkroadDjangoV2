from django.urls import path
from . import api_export

urlpatterns = [
    # Export API
    path('api/export/partner/', api_export.AnalyticalExportAPIView.as_view(), name='api_analytics_export'),
]
