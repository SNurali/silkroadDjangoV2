from django import forms
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import Sight, Ticket, Booking


class MultipleFileInput(forms.ClearableFileInput):
    """
    Кастомный виджет для множественной загрузки файлов.
    """
    template_name = 'django/forms/widgets/clearable_file_input.html'
    attrs = {'multiple': True}

    def value_from_datadict(self, data, files, name):
        if isinstance(files.get(name), list):
            return files.getlist(name)
        return files.get(name, None)


class SightForm(forms.ModelForm):
    """
    Форма создания/редактирования достопримечательности.
    """
    images = forms.FileField(
        required=False,
        widget=MultipleFileInput(),
        label=_('Фотографии (несколько файлов)'),
        help_text=_('Можно загрузить несколько фотографий сразу')
    )

    class Meta:
        model = Sight
        fields = (
            'name', 'description', 'sh_description', 'address', 'geolocation',
            'category', 'is_foreg', 'is_local', 'max_capacity', 'opening_times',
            'extra_services', 'required_conditions', 'enable_tickets'
        )
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-input'}),
            'description': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 5}),
            'sh_description': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
            'address': forms.TextInput(attrs={'class': 'form-input'}),
            'geolocation': forms.TextInput(attrs={'class': 'form-input'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'is_foreg': forms.NumberInput(attrs={'class': 'form-input'}),
            'is_local': forms.NumberInput(attrs={'class': 'form-input'}),
            'max_capacity': forms.NumberInput(attrs={'class': 'form-input', 'min': '1'}),
            'opening_times': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
            'extra_services': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
            'required_conditions': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
            'enable_tickets': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }

    def save(self, commit=True):
        sight = super().save(commit=False)

        if commit:
            sight.save()

            # Обработка загруженных изображений
            files = self.files.getlist('images')
            if files:
                year = timezone.now().year
                month = timezone.now().month
                day = timezone.now().day
                id_padded = str(sight.id).zfill(5)

                base_path = f"sights/{id_padded}/{year}/{month:02d}/{day:02d}"
                images_list = []

                for file in files:
                    rel_path = f"{base_path}/{file.name}"
                    full_path = sight.vendor.media_root / rel_path

                    full_path.parent.mkdir(parents=True, exist_ok=True)

                    with open(full_path, 'wb+') as destination:
                        for chunk in file.chunks():
                            destination.write(chunk)

                    images_list.append(rel_path)

                sight.images = ','.join(images_list)
                sight.save(update_fields=['images'])

        return sight


class TicketForm(forms.ModelForm):
    """
    Форма покупки билета на достопримечательность.
    """
    total_qty = forms.IntegerField(
        min_value=1,
        initial=1,
        required=True,
        label=_('Количество билетов'),
        widget=forms.NumberInput(attrs={
            'class': 'form-input w-24',
            'min': '1',
            'hx-get': '/sights/calculate-total/',
            'hx-target': '#total-amount',
            'hx-trigger': 'change',
            'hx-include': '[name=sight_id]'
        })
    )

    class Meta:
        model = Ticket
        fields = ('total_qty',)

    def __init__(self, *args, **kwargs):
        self.sight = kwargs.pop('sight', None)
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def clean_total_qty(self):
        qty = self.cleaned_data.get('total_qty')

        if qty is None:
            qty = 1

        if qty < 1:
            raise forms.ValidationError(_("Количество должно быть не менее 1."))

        if self.sight and self.sight.max_capacity is not None:
            if qty > self.sight.max_capacity:
                raise forms.ValidationError(
                    _("Количество билетов не может превышать максимальную вместимость объекта ({capacity} чел.)").format(
                        capacity=self.sight.max_capacity
                    )
                )

        return qty

    def save(self, commit=True):
        if not self.sight:
            raise ValueError("Sight instance is required to create Ticket")

        ticket = super().save(commit=False)

        # Порядок КРИТИЧЕСКИ важен!
        ticket.sight = self.sight
        ticket.vendor = self.sight.vendor
        ticket.created_by = self.user

        # Только теперь sight привязан → calculate_total() может безопасно обращаться к self.sight
        ticket.total_amount = ticket.calculate_total()

        if commit:
            ticket.save()


class BookingForm(forms.ModelForm):
    """
    Форма бронирования отеля.
    """
    check_in = forms.DateField(
        label=_('Дата заезда'),
        widget=forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
        required=True
    )
    check_out = forms.DateField(
        label=_('Дата выезда'),
        widget=forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
        required=True
    )
    adults = forms.IntegerField(
        label=_('Взрослых'),
        min_value=1,
        initial=1,
        widget=forms.NumberInput(attrs={'class': 'form-input', 'min': '1'})
    )
    children = forms.IntegerField(
        label=_('Детей'),
        min_value=0,
        initial=0,
        required=False,
        widget=forms.NumberInput(attrs={'class': 'form-input', 'min': '0'})
    )
    selected_rooms_json = forms.CharField(
        widget=forms.HiddenInput(),
        required=True
    )
    total_price = forms.DecimalField(
        widget=forms.HiddenInput(),
        required=True
    )

    class Meta:
        model = Booking
        fields = (
            'check_in', 'check_out', 'adults', 'children',
            'guest_name', 'guest_email', 'guest_phone',
            'selected_rooms_json', 'total_price', 'special_requests'
        )
        widgets = {
            'guest_name': forms.TextInput(attrs={'class': 'form-input'}),
            'guest_email': forms.EmailInput(attrs={'class': 'form-input'}),
            'guest_phone': forms.TextInput(attrs={'class': 'form-input'}),
            'special_requests': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3}),
        }

    def clean(self):
        cleaned_data = super().clean()
        check_in = cleaned_data.get('check_in')
        check_out = cleaned_data.get('check_out')

        if check_in and check_out:
            if check_in >= check_out:
                raise forms.ValidationError(_("Дата выезда должна быть позже даты заезда."))
            
            if check_in < timezone.now().date():
                raise forms.ValidationError(_("Дата заезда не может быть в прошлом."))

        return cleaned_data