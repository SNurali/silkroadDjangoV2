from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

class Payment(models.Model):
    """
    Unified Payment model for all services (Hotels, Tours, Flights, etc.).
    Links to any object via ContentType.
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Ожидание")
        PROCESSING = "PROCESSING", _("В обработке")
        PAID = "PAID", _("Оплачено")
        FAILED = "FAILED", _("Ошибка")
        CANCELED = "CANCELED", _("Отменено")
        REFUNDED = "REFUNDED", _("Возврат")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Сумма"))
    currency = models.CharField(max_length=5, default="UZS", verbose_name=_("Валюта"))

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    provider = models.CharField(max_length=20, default="YAGONA", verbose_name=_("Провайдер"))
    external_payment_id = models.CharField(max_length=128, null=True, blank=True, verbose_name=_("ID платежа в системе"))

    # Generic relation to paid object (Booking, TicketSale, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    related_object = GenericForeignKey("content_type", "object_id")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Платеж")
        verbose_name_plural = _("Платежи")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Payment #{self.id} ({self.amount} {self.currency}) - {self.status}"
