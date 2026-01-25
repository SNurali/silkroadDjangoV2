from django.db import models
from django.utils.translation import gettext_lazy as _


class Country(models.Model):
    """
    Страна.
    """
    name = models.CharField(max_length=255, verbose_name=_('название'))
    iso_code = models.CharField(max_length=10, blank=True, null=True, verbose_name=_('ISO код'))
    is_active = models.BooleanField(default=True, verbose_name=_('активна'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'countries'
        verbose_name = _('страна')
        verbose_name_plural = _('страны')
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Region(models.Model):
    """
    Регион / область.
    """
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name='regions',
        verbose_name=_('страна')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
    is_active = models.BooleanField(default=True, verbose_name=_('активен'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'regions'
        verbose_name = _('регион')
        verbose_name_plural = _('регионы')
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class District(models.Model):
    """
    Район.
    """
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name='districts',
        verbose_name=_('регион')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
    is_active = models.BooleanField(default=True, verbose_name=_('активен'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'districts'
        verbose_name = _('район')
        verbose_name_plural = _('районы')
        ordering = ['name']

    def __str__(self) -> str:
        return self.name
# Removed duplicate Sight model

