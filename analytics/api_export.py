from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from analytics.schema import get_client
import csv
from django.http import HttpResponse
import io

class AnalyticalExportAPIView(APIView):
    """
    API for exporting analytical data.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        export_type = request.GET.get('type', 'json')
        client = get_client()
        
        query = "SELECT region, count() as total_bookings, sum(amount) as gmv FROM booking_events GROUP BY region"
        results = client.execute(query)
        
        data = [
            {'region': row[0], 'total_bookings': row[1], 'gmv': float(row[2])}
            for row in results
        ]
        
        if export_type == 'csv':
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=['region', 'total_bookings', 'gmv'])
            writer.writeheader()
            writer.writerows(data)
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="analytics_export.csv"'
            return response
            
        return Response(data)
