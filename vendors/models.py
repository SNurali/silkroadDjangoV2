from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.models import User
from locations.models import Country, Region, District


class Vendor(models.Model):
    """
    Модель поставщика/вендора (достопримечательности, отели и т.д.).
    Соответствует таблице tb_vendors из Laravel.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='vendor_profile',
        null=True,
        blank=True,
        verbose_name=_('связанный пользователь')
    )
    country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendors',
        verbose_name=_('страна')
    )
    region = models.ForeignKey(
        Region,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendors',
        verbose_name=_('регион')
    )
    district = models.ForeignKey(
        District,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendors',
        verbose_name=_('район')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    category = models.ForeignKey(
        'hotels.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendors',
        verbose_name=_('категория')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('активен'))
    geo = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('геолокация'))
    photo = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('фото'))
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес'))
    entry_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entered_vendors',
        verbose_name=_('создал')
    )
    attributes = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('атрибуты'))
    bill_data = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('платёжные данные'))

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_vendors'
        verbose_name = _('vendor')
        verbose_name_plural = _('vendors')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name or f"Vendor #{self.id}"

    def get_geo_tuple(self):
        if not self.geo:
            return None
        try:
            lat, lng = map(float, self.geo.split(','))
            return (lat, lng)
        except (ValueError, IndexError):
            return None