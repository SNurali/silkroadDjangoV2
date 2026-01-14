from django.views.generic import CreateView, UpdateView, TemplateView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.utils.translation import gettext_lazy as _
from django.shortcuts import redirect

from django.contrib.auth import views as auth_views

from .forms import RegisterForm, ProfileForm
from .models import User


class RegisterView(SuccessMessageMixin, CreateView):
    """
    Регистрация нового пользователя.
    Автоматический редирект на профиль, если пользователь уже авторизован.
    """
    model = User
    form_class = RegisterForm
    template_name = 'registration/register.html'
    success_url = reverse_lazy('accounts:login')
    success_message = _("Регистрация успешна! Теперь можно войти.")

    def dispatch(self, request, *args, **kwargs):
        # Если пользователь уже авторизован — сразу на профиль
        if request.user.is_authenticated:
            return redirect('accounts:profile')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        form.instance.role = 'agent'
        form.instance.is_active = True
        return super().form_valid(form)


class LoginView(auth_views.LoginView):
    """
    Кастомная страница входа.
    """
    template_name = 'registration/login.html'
    redirect_authenticated_user = True


class LogoutView(auth_views.LogoutView):
    """
    Выход из системы с редиректом на главную.
    """
    next_page = reverse_lazy('hotels:sight_list')


class ProfileView(LoginRequiredMixin, TemplateView):
    """
    Просмотр личного кабинета пользователя.
    """
    template_name = 'accounts/profile.html'
    login_url = reverse_lazy('accounts:login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = _('Личный кабинет')
        context['user'] = self.request.user
        return context


class ProfileUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    """
    Редактирование профиля пользователя.
    """
    model = User
    form_class = ProfileForm
    template_name = 'accounts/profile_edit.html'
    success_url = reverse_lazy('accounts:profile')
    success_message = _("Профиль успешно обновлён.")
    login_url = reverse_lazy('accounts:login')

    def get_object(self, queryset=None):
        return self.request.user

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['instance'] = self.request.user
        return kwargs