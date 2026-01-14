from django.shortcuts import get_object_or_404
from django.views.generic import ListView, DetailView
from django.http import HttpResponse
from django.template.loader import render_to_string

from locations.models import Region
from hotels.models import Category, Sight, SightFacility  # Category берём из hotels


class SightListView(ListView):
    """
    Список всех активных достопримечательностей с фильтрами.
    Поддерживает htmx для динамического обновления.
    """
    model = Sight
    template_name = 'hotels/sight_list.html'
    context_object_name = 'sights'
    paginate_by = 12

    def get_queryset(self):
        qs = Sight.objects.filter(status='active').select_related('vendor', 'category', 'vendor__region')

        category_id = self.request.GET.get('category')
        region_id = self.request.GET.get('region')

        if category_id:
            qs = qs.filter(category_id=category_id)
        if region_id:
            qs = qs.filter(vendor__region_id=region_id)

        return qs.order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Достопримечательности Узбекистана'
        context['categories'] = Category.objects.filter(is_active=True).order_by('name')
        context['regions'] = Region.objects.filter(is_active=True).order_by('name')
        context['selected_category'] = self.request.GET.get('category', '')
        context['selected_region'] = self.request.GET.get('region', '')
        return context

    def partial_list(self, request, *args, **kwargs):
        """
        Для htmx: возвращает только фрагмент списка (без всей страницы).
        """
        context = self.get_context_data(object_list=self.get_queryset())
        html = render_to_string('hotels/partials/sight_list_partial.html', context, request=request)
        return HttpResponse(html)


class SightDetailView(DetailView):
    """
    Детальная страница достопримечательности.
    """
    model = Sight
    template_name = 'hotels/sight_detail.html'
    context_object_name = 'sight'

    def get_object(self, queryset=None):
        return get_object_or_404(
            Sight,
            pk=self.kwargs['pk'],
            status='active'
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['facilities'] = self.object.facilities.all()
        context['images'] = self.object.get_images_list()
        context['page_title'] = self.object.name
        return context