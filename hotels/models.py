from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.models import User
from vendors.models import Vendor


class Category(models.Model):
    """
    Категория достопримечательностей / вендоров.
    """
    name = models.CharField(max_length=255, verbose_name=_('название'))
    photo = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('фото'))
    entry_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_categories',
        verbose_name=_('создал')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('активна'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_categories'
        verbose_name = _('категория')
        verbose_name_plural = _('категории')
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Sight(models.Model):
    """
    Основная модель достопримечательности.
    """
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='sights',
        verbose_name=_('вендор')
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sights',
        verbose_name=_('категория')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    description = models.TextField(blank=True, null=True, verbose_name=_('описание'))
    sh_description = models.TextField(blank=True, null=True, verbose_name=_('короткое описание'))
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес'))
    geolocation = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('геолокация'))
    images = models.TextField(blank=True, null=True, verbose_name=_('изображения (через запятую)'))

    status = models.CharField(
        max_length=20,
        default='active',
        choices=[('active', _('Активен')), ('inactive', _('Неактивен')), ('pending', _('На модерации'))],
        verbose_name=_('статус')
    )

    is_foreg = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для иностранцев'))
    is_local = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для местных'))

    max_capacity = models.IntegerField(null=True, blank=True, verbose_name=_('макс. вместимость'))
    opening_times = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('время работы'))
    extra_services = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('доп. услуги'))
    required_conditions = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('требуемые условия'))
    enable_tickets = models.BooleanField(default=False, verbose_name=_('включены билеты'))
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_sights',
        verbose_name=_('создал')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_sights'
        verbose_name = _('достопримечательность')
        verbose_name_plural = _('достопримечательности')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name

    def get_images_list(self):
        """Возвращает список изображений с правильным префиксом /media/ (без дублирования sights/)"""
        if not self.images:
            return []

        raw_list = [img.strip() for img in self.images.split(',') if img.strip()]

        # Добавляем /media/ только к относительным путям, не трогаем http и /media/
        return [
            f"/media/{img.lstrip('/')}" if not img.startswith(('/media/', 'http')) else img
            for img in raw_list
        ]


class SightFacility(models.Model):
    """
    Удобства достопримечательности.
    """
    sight = models.ForeignKey(
        Sight,
        on_delete=models.CASCADE,
        related_name='facilities',
        verbose_name=_('достопримечательность')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    icon = models.CharField(max_length=100, blank=True, null=True, verbose_name=_('иконка'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))

    class Meta:
        db_table = 'tb_sight_facilities'
        verbose_name = _('удобство')
        verbose_name_plural = _('удобства')
        ordering = ['name']

    def __str__(self) -> str:
        return f'{self.name} — {self.sight}'


class Ticket(models.Model):
    """
    Билет на достопримечательность.
    """
    sight = models.ForeignKey(
        Sight,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name=_('достопримечательность')
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name=_('вендор')
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tickets',
        verbose_name=_('создал')
    )
    total_qty = models.PositiveIntegerField(default=1, verbose_name=_('количество'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('сумма'))
    is_paid = models.BooleanField(default=False, verbose_name=_('оплачен'))
    is_valid = models.BooleanField(default=True, verbose_name=_('валиден'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_tickets'
        verbose_name = _('билет')
        verbose_name_plural = _('билеты')
        ordering = ['-created_at']

    def calculate_total(self):
        """Расчёт суммы в зависимости от роли пользователя"""
        if not self.sight:
            return Decimal('0')

        # Пример: можно добавить логику по роли пользователя
        user = self.created_by
        if user and user.role == 'agent':  # или другая логика
            return self.sight.is_local * self.total_qty

        return self.sight.is_foreg * self.total_qty

    def __str__(self) -> str:
        return f'Билет #{self.id} — {self.sight}'