from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _


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
            ('agent', 'Agent'),
        ],
        default='agent',
        db_index=True
    )
    is_active = models.BooleanField(default=True)
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

    def __str__(self) -> str:
        return self.email or self.get_full_name() or f"User #{self.id}"

    def get_full_name(self) -> str:
        """
        Возвращает полное имя пользователя (name + lname).
        Используется в админке и шаблонах.
        """
        parts = [part for part in (self.name, self.lname) if part]
        return ' '.join(parts).strip() or self.email