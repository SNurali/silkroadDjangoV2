from django import forms
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import Sight


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