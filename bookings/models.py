from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User

class Booking(models.Model):
    """
    Основная модель бронирования (Enterprise уровень).
    Синхронизируется с e-mehmon.
    """
    STATUS_CHOICES = [
        ('NEW', _('Новый')),
        ('CONFIRMED', _('Подтвержден')),
        ('REJECTED', _('Отклонен')),
        ('COMPLETED', _('Завершен')),
        ('CANCELLED', _('Отменен')),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enterprise_bookings', verbose_name=_('Пользователь'), db_index=True)
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='enterprise_bookings', verbose_name=_('Отель'), db_index=True)
    room_type = models.ForeignKey('hotels.RoomType', on_delete=models.SET_NULL, null=True, related_name='enterprise_bookings', verbose_name=_('Тип номера'))
    
    check_in = models.DateField(verbose_name=_('Дата заезда'), db_index=True)
    check_out = models.DateField(verbose_name=_('Дата выезда'), db_index=True)
    
    adults = models.PositiveIntegerField(default=1, verbose_name=_('Взрослых'))
    children = models.PositiveIntegerField(default=0, verbose_name=_('Детей'))
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW', verbose_name=_('Статус'), db_index=True)
    
    # Ссылка на внешнюю систему e-mehmon
    emehmon_id = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('ID в e-mehmon'), db_index=True)
    
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('Общая стоимость'))
    currency = models.ForeignKey('config_module.CurrencyRate', on_delete=models.PROTECT, related_name='bookings', verbose_name=_('Валюта'))

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Audit & Rejection
    rejection_reason = models.TextField(blank=True, null=True, verbose_name=_('Причина отказа'))
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_bookings', verbose_name=_('Кем подтверждено'))
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Время подтверждения'))

    class Meta:
        db_table = 'tb_bookings_v2'
        verbose_name = _('Бронирование (v2)')
        verbose_name_plural = _('Бронирования (v2)')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['check_in', 'check_out']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['hotel', 'status']),
        ]

    def mark_as_paid(self):
        """
        Marks booking as paid and confirmed.
        Called by Payment webhook service.
        """
        if self.status != 'CONFIRMED':
            self.status = 'CONFIRMED'
            self.save(update_fields=['status'])

    def __str__(self):
        return f"Booking #{self.id} for {self.user.email} ({self.status})"

class BookingStatusHistory(models.Model):
    """
    История изменения статусов бронирования.
    """
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='history', verbose_name=_('Бронирование'))
    status = models.CharField(max_length=20, choices=Booking.STATUS_CHOICES, verbose_name=_('Статус'))
    comment = models.TextField(blank=True, null=True, verbose_name=_('Комментарий'))
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_('Время изменения'))
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name=_('Кто изменил'))

    class Meta:
        db_table = 'tb_booking_status_history'
        verbose_name = _('История статуса бронирования')
        verbose_name_plural = _('История статусов бронирования')
        ordering = ['-timestamp']
