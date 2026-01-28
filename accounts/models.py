from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _


from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Кастомная модель пользователя (единственная в проекте).
    Авторизация по email, роли: admin / vendor / agent.
    Полностью соответствует таблице tb_users из Laravel.
    """
    username = None
    email = models.EmailField(
        _('email address'),
        unique=True,
        max_length=199,
        db_index=True
    )
    name = models.CharField(max_length=199, blank=True, null=True)
    lname = models.CharField(max_length=255, blank=True, null=True)
    id_citizen = models.IntegerField(null=True, blank=True)
    dtb = models.DateField(null=True, blank=True)
    pspissuedt = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')], null=True, blank=True)
    phone = models.CharField(max_length=199, blank=True, null=True)
    passport = models.CharField(max_length=200, blank=True, null=True)
    photo = models.CharField(max_length=100, blank=True, null=True)
    social_id = models.CharField(max_length=255, blank=True, null=True)
    social_type = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('admin', 'Admin'),
            ('vendor', 'Vendor'),
            ('vendor_op', 'Vendor Operator'),
            ('hotel_admin', 'Hotel Admin'),
            ('moderator', 'Moderator'),
            ('content_op', 'Content Operator'),
            ('user', 'User'),
        ],
        default='user',
        db_index=True
    )
    is_active = models.BooleanField(default=True)
    is_phone_verified = models.BooleanField(default=False, verbose_name=_('Телефон подтвержден'))
    is_foreigner = models.BooleanField(default=False, verbose_name=_('Иностранец'))
    
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users'
    )
    last_login = models.DateTimeField(null=True, blank=True)

    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        related_name='custom_user_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        related_name='custom_user_permissions',
        related_query_name='user',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'tb_users'
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']

    objects = CustomUserManager()

    def __str__(self) -> str:
        return self.email or self.get_full_name() or f"User #{self.id}"

    def get_full_name(self) -> str:
        """
        Возвращает полное имя пользователя (name + lname).
        Используется в админке и шаблонах.
        """
        parts = [part for part in (self.name, self.lname) if part]
        return ' '.join(parts).strip() or self.email


class UserImage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='user_photos/%Y/%m/%d/')
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tb_user_images'
        ordering = ['order', '-uploaded_at']

    def _get_next_order(self):
        last = self.__class__.objects.filter(user=self.user).aggregate(models.Max('order'))['order__max']
        return (last or 0) + 1


class Traveler(models.Model):
    """
    Модель для сохранения данных попутчиков (Travelers).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='travelers')
    first_name = models.CharField(max_length=255, verbose_name=_('Имя'))
    last_name = models.CharField(max_length=255, verbose_name=_('Фамилия'))
    middle_name = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Отчество'))
    
    birth_date = models.DateField(verbose_name=_('Дата рождения'))
    gender = models.CharField(
        max_length=10, 
        choices=[('male', _('Мужской')), ('female', _('Женский'))],
        verbose_name=_('Пол')
    )
    
    citizenship = models.CharField(max_length=100, default='Uzbekistan', verbose_name=_('Гражданство'))
    passport_number = models.CharField(max_length=50, verbose_name=_('Номер паспорта'))
    passport_expiry = models.DateField(blank=True, null=True, verbose_name=_('Срок действия паспорта'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tb_travelers'
        ordering = ['-created_at']
        verbose_name = _('Попутчик')
        verbose_name_plural = _('Попутчики')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
class ForeignProfileData(models.Model):
    """
    Данные иностранного профиля из e-mehmon API.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='foreign_data', verbose_name=_('Пользователь'))
    entry_date = models.DateField(null=True, blank=True, verbose_name=_('Дата въезда'))
    days_remaining = models.IntegerField(default=0, verbose_name=_('Осталось дней'))
    has_violations = models.BooleanField(default=False, verbose_name=_('Есть нарушения'))
    current_registration_place = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Место текущей регистрации'))
    visa_expiry_date = models.DateField(null=True, blank=True, verbose_name=_('Срок действия визы'))
    last_sync_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Последняя синхронизация'))
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tb_foreign_profile_data'
        verbose_name = _('Данные иностранца')
        verbose_name_plural = _('Данные иностранцев')

    def __str__(self):
        return f"Foreign data for {self.user.email}"

class SecurityLog(models.Model):
    """
    Аудит безопасности: логирует важные действия (login, export, payment).
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='security_logs')
    action = models.CharField(max_length=255, verbose_name=_('Действие'))
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('IP адрес'))
    user_agent = models.TextField(null=True, blank=True, verbose_name=_('User Agent'))
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)

    class Meta:
        db_table = 'tb_security_logs'
        verbose_name = _('Лог безопасности')
        verbose_name_plural = _('Логи безопасности')
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} @ {self.timestamp}"
