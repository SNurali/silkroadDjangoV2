
from django.db.models import Q
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Region, District, Country
from hotels.models import Sight
from .serializers import CountrySerializer, SightSerializer

class SightListAPIView(generics.ListAPIView):
    queryset = Sight.objects.filter(status='active')
    serializer_class = SightSerializer
    permission_classes = [AllowAny]
    search_fields = ['name', 'description', 'content']

class CountryListAPIView(generics.ListAPIView):
    queryset = Country.objects.filter(is_active=True).order_by('name')
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]
    pagination_class = None

@api_view(['GET'])
@permission_classes([AllowAny])
def search_locations(request):
    """
    Search for regions or districts by name (multi-lingual).
    Query param: ?q=...&lang=...
    """
    query = request.GET.get('q', '').strip()
    lang = request.GET.get('lang', 'en')
    
    if not query or len(query) < 2:
        return Response([])

    results = []
    
    # Helper to get name
    def get_name(obj, lang_code):
        if lang_code == 'ru':
            return obj.name_ru or obj.name
        elif lang_code == 'uz':
            return obj.name_uz or obj.name
        return obj.name

    # 1. Search Regions
    regions = Region.objects.filter(
        Q(name__icontains=query) | 
        Q(name_ru__icontains=query) | 
        Q(name_uz__icontains=query),
        is_active=True
    )[:5]

    for r in regions:
        display_name = get_name(r, lang)
        # Type localization
        type_name = 'Region'
        if lang == 'ru': type_name = 'Регион'
        if lang == 'uz': type_name = 'Viloyat'

        results.append({
            'id': r.id,
            'name': r.name,
            'type': type_name, 
            'display_name': display_name
        })

    # 2. Search Districts (Cities)
    districts = District.objects.filter(
        Q(name__icontains=query) | 
        Q(name_ru__icontains=query) | 
        Q(name_uz__icontains=query),
        is_active=True
    )[:10]

    for d in districts:
        display_name = get_name(d, lang)
        
        # Region name for context
        region_name = ""
        if d.region:
            region_name = get_name(d.region, lang)
            
        full_display = f"{display_name}, {region_name}" if region_name else display_name
        
        type_name = 'City'
        if lang == 'ru': type_name = 'Город'
        if lang == 'uz': type_name = 'Shahar'

        results.append({
            'id': d.id,
            'name': d.name,
            'type': type_name,
            'display_name': full_display
        })

    return Response(results)


class RegionListAPIView(generics.ListAPIView):
    """
    API List for Regions.
    """
    queryset = Region.objects.filter(is_active=True).order_by('name')
    serializer_class = lambda x: x # We will define simple inline serializer or use values
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        regions = self.get_queryset()
        data = [{"id": r.id, "name": r.name} for r in regions]
        return Response(data)

class DistrictListAPIView(generics.ListAPIView):
    serializer_class = lambda x: x # Inline custom
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        region_id = self.request.query_params.get('region_id')
        if region_id:
            return District.objects.filter(region_id=region_id, is_active=True).order_by('name')
        return District.objects.none()

    def get(self, request, *args, **kwargs):
        districts = self.get_queryset()
        data = [{"id": d.id, "name": d.name} for d in districts]
        return Response(data)
