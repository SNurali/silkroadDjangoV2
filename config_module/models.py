from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.cache import cache

class CurrencyRate(models.Model):
    """
    Курсы валют (USD, UZS и т.д.).
    Синхронизируется через API ЦБ или внешние сервисы.
    """
    code = models.CharField(max_length=3, unique=True, verbose_name=_('Код валюты (USD, UZS)'))
    rate_to_uzs = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Курс к суму'))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tb_currency_rates'
        verbose_name = _('Курс валюты')
        verbose_name_plural = _('Курсы валют')

    def __str__(self):
        return f"{self.code}: {self.rate_to_uzs} UZS"

    @classmethod
    def get_rate(cls, code):
        cache_key = f"currency_rate_{code}"
        rate = cache.get(cache_key)
        if rate:
            return rate
        try:
            obj = cls.objects.get(code=code)
            cache.set(cache_key, obj.rate_to_uzs, 3600)
            return obj.rate_to_uzs
        except cls.DoesNotExist:
            return None

    def convert_to_uzs(self, amount):
        return amount * self.rate_to_uzs

    def convert_from_uzs(self, amount_uzs):
        if self.rate_to_uzs == 0:
            return 0
        return amount_uzs / self.rate_to_uzs

class SystemConfig(models.Model):
    """
    Глобальные настройки системы (включая Maintenance Mode).
    """
    key = models.CharField(max_length=100, unique=True, verbose_name=_('Ключ настройки'))
    value = models.JSONField(verbose_name=_('Значение'))
    description = models.TextField(blank=True, null=True, verbose_name=_('Описание'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активен'))
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tb_system_config'
        verbose_name = _('Системная настройка')
        verbose_name_plural = _('Системные настройки')

    def __str__(self):
        return self.key

    @classmethod
    def get_value(cls, key, default=None):
        cache_key = f"system_config_{key}"
        cached_val = cache.get(cache_key)
        if cached_val is not None:
            return cached_val
            
        try:
            config = cls.objects.get(key=key, is_active=True)
            cache.set(cache_key, config.value, 3600) # Cache for 1 hour
            return config.value
        except cls.DoesNotExist:
            return default
