from django import forms
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import UserCreationForm

from .models import User


class RegisterForm(UserCreationForm):
    """
    Форма регистрации нового пользователя.
    """
    email = forms.EmailField(
        required=True,
        label=_('Email'),
        widget=forms.EmailInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': 'email@example.com'
        })
    )
    name = forms.CharField(
        max_length=199,
        required=True,
        label=_('Имя'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': 'Имя'
        })
    )
    lname = forms.CharField(
        max_length=255,
        required=False,
        label=_('Фамилия'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': 'Фамилия (не обязательно)'
        })
    )
    phone = forms.CharField(
        max_length=199,
        required=False,
        label=_('Телефон'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': '+998 XX XXX XX XX'
        })
    )

    class Meta:
        model = User
        fields = ('email', 'name', 'lname', 'phone', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': '••••••••'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': '••••••••'
        })

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError(_("Этот email уже зарегистрирован."))
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.name = self.cleaned_data['name']
        user.lname = self.cleaned_data['lname']
        user.phone = self.cleaned_data['phone']
        user.role = 'agent'  # по умолчанию для обычной регистрации
        user.is_active = True
        if commit:
            user.save()
        return user


class ProfileForm(forms.ModelForm):
    """
    Форма редактирования профиля пользователя.
    """
    email = forms.EmailField(
        disabled=True,
        required=False,
        widget=forms.EmailInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 bg-gray-100 shadow-sm sm:text-sm cursor-not-allowed px-4 py-3',
            'placeholder': 'Email (нельзя изменить)'
        })
    )

    name = forms.CharField(
        max_length=199,
        required=True,
        label=_('Имя'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': 'Имя'
        })
    )

    lname = forms.CharField(
        max_length=255,
        required=False,
        label=_('Фамилия'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': 'Фамилия (не обязательно)'
        })
    )

    phone = forms.CharField(
        max_length=199,
        required=False,
        label=_('Телефон'),
        widget=forms.TextInput(attrs={
            'class': 'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-3',
            'placeholder': '+998 XX XXX XX XX'
        })
    )

    class Meta:
        model = User
        fields = ('email', 'name', 'lname', 'phone')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance:
            self.fields['email'].initial = self.instance.email

    def clean_email(self):
        return self.instance.email if self.instance else self.cleaned_data['email']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.name = self.cleaned_data['name']
        user.lname = self.cleaned_data['lname']
        user.phone = self.cleaned_data['phone']
        if commit:
            user.save()
        return user