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
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
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
    address_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес (RU)'))
    address_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес (UZ)'))
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

    # Enterprise fields
    business_type = models.CharField(max_length=100, blank=True, null=True, verbose_name=_('Вид деятельности'))
    inn = models.CharField(max_length=20, blank=True, null=True, verbose_name=_('ИНН'))
    company_name = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('Название компании'))
    checking_account = models.CharField(max_length=50, blank=True, null=True, verbose_name=_('Расчётный счёт'))
    mfo = models.CharField(max_length=20, blank=True, null=True, verbose_name=_('МФО'))
    contacts = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('Контакты'))
    
    # Role separation: VENDOR (owner) vs VENDOR_OPERATOR (employee)
    operator_role = models.CharField(
        max_length=20,
        choices=[
            ('vendor', 'Vendor Owner'),
            ('vendor_op', 'Vendor Operator')
        ],
        default='vendor',
        verbose_name=_('Роль оператора')
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_vendors'
        verbose_name = _('vendor')
        verbose_name_plural = _('vendors')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name or f"Vendor #{self.id}"


class VendorService(models.Model):
    """
    Услуга вендора (экскурсия, трансфер и т.д.).
    """
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='services', verbose_name=_('Вендор'))
    type = models.CharField(max_length=100, verbose_name=_('Тип услуги'))
    description = models.TextField(verbose_name=_('Описание'))
    photos = models.JSONField(default=list, blank=True, null=True, verbose_name=_('Фотографий'))
    schedule = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('График работы'))
    has_tickets = models.BooleanField(default=False, verbose_name=_('Продажа билетов'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tb_vendor_services'
        verbose_name = _('Услуга вендора')
        verbose_name_plural = _('Услуги вендоров')

    def __str__(self):
        return f"{self.type} - {self.vendor.name}"


class ServiceTicket(models.Model):
    """
    Логика билетов для услуги.
    """
    service = models.ForeignKey(VendorService, on_delete=models.CASCADE, related_name='ticket_types', verbose_name=_('Услуга'))
    
    weekday_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Цена в будни'))
    weekend_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Цена в выходные'))
    resident_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Цена для резидентов'))
    non_resident_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Цена для нерезидентов'))
    
    max_tickets = models.IntegerField(null=True, blank=True, verbose_name=_('Макс. билетов (null=безлимит)'))
    validity_period = models.DurationField(verbose_name=_('Срок действия билета'))
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tb_service_tickets'
        verbose_name = _('Тип билета')
        verbose_name_plural = _('Типы билетов')


class TicketSale(models.Model):
    """
    Продажа билета.
    """
    ticket_type = models.ForeignKey(ServiceTicket, on_delete=models.PROTECT, related_name='sales', verbose_name=_('Тип билета'))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ticket_purchases', verbose_name=_('Покупатель'))
    purchase_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='NEW', choices=[('NEW', 'New'), ('PAID', 'Paid'), ('USED', 'Used'), ('CANCELLED', 'Cancelled')])
    price_paid = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.ForeignKey('config_module.CurrencyRate', on_delete=models.PROTECT)
    
    qr_code = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'tb_ticket_sales'
        verbose_name = _('Продажа билета')
        verbose_name_plural = _('Продажи билетов')

    def get_geo_tuple(self):
        if not self.geo:
            return None
        try:
            lat, lng = map(float, self.geo.split(','))
            return (lat, lng)
        except (ValueError, IndexError):
            return None


class VendorImage(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='vendor_photos/%Y/%m/%d/')
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tb_vendor_images'
        ordering = ['order', '-uploaded_at']
    
    def _get_next_order(self):
        last = self.__class__.objects.filter(vendor=self.vendor).aggregate(models.Max('order'))['order__max']
        return (last or 0) + 1


class MediaFile(models.Model):
    """
    Legacy table: media_files
    Maps legacy IDs to file paths.
    """
    id = models.BigIntegerField(primary_key=True)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    file_path = models.CharField(max_length=255, null=True, blank=True)
    file_size = models.CharField(max_length=255, null=True, blank=True)
    file_type = models.CharField(max_length=255, null=True, blank=True)
    file_extension = models.CharField(max_length=255, null=True, blank=True)
    
    # Generic relations or just references
    model_type = models.CharField(max_length=255, null=True, blank=True)
    model_id = models.BigIntegerField(null=True, blank=True)
    collection_name = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'media_files'
        verbose_name = _('медиа файл')
        verbose_name_plural = _('медиа файлы')

    def __str__(self):
        return self.file_name or str(self.id)