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
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
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


class ExtraService(models.Model):
    name = models.CharField(max_length=255)
    class Meta:
        db_table = 'extra_services'
        # managed = False  # Changed to True to create tables

class RequiredCondition(models.Model):
    name = models.CharField(max_length=255)
    class Meta:
        db_table = 'required_conditions'
        # managed = False


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
    region = models.ForeignKey(
        'locations.Region',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sights',
        verbose_name=_('регион')
    )
    district = models.ForeignKey(
        'locations.District',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sights',
        verbose_name=_('район')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
    description = models.TextField(blank=True, null=True, verbose_name=_('описание'))
    description_ru = models.TextField(blank=True, null=True, verbose_name=_('описание (RU)'))
    description_uz = models.TextField(blank=True, null=True, verbose_name=_('описание (UZ)'))
    policy = models.TextField(blank=True, null=True, verbose_name=_('политика (policy)'))
    sh_description = models.TextField(blank=True, null=True, verbose_name=_('короткое описание'))
    sh_description_ru = models.TextField(blank=True, null=True, verbose_name=_('короткое описание (RU)'))
    sh_description_uz = models.TextField(blank=True, null=True, verbose_name=_('короткое описание (UZ)'))
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес'))
    geolocation = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('геолокация'))
    images = models.TextField(blank=True, null=True, verbose_name=_('изображения (через запятую)'))

    status = models.CharField(
        max_length=20,
        default='active',
        choices=[('active', _('Активен')), ('inactive', _('Неактивен')), ('pending', _('На модерации'))],
        verbose_name=_('статус')
    )

    is_foreg = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для иностранцев (будни)'))
    is_local = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для местных (будни)'))
    is_weekend_foreg = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для иностранцев (выходные)'))
    is_weekend_local = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена для местных (выходные)'))

    max_capacity = models.IntegerField(null=True, blank=True, verbose_name=_('макс. вместимость'))
    opening_times = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('время работы'))
    extra_services = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('доп. услуги'))
    required_conditions = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('требуемые условия'))

    # New JSON fields for legacy Hotel compatibility
    amenities_services = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('удобства и услуги'))
    safety = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('безопасность'))
    payment_methods = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('способы оплаты'))
    staff_languages = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('языки персонала'))
    activities = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('развлечения'))

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
    is_valid = models.BooleanField(default=False, verbose_name=_('валиден')) # Default False until confirmed
    
    # Confirmation Workflow
    booking_status = models.CharField(
        max_length=20,
        default='pending',
        choices=[
            ('pending', 'Pending'),
            ('confirmed', 'Confirmed'),
            ('cancelled', 'Cancelled'),
            ('expired', 'Expired'),
            ('completed', 'Completed')
        ],
        verbose_name=_('статус бронирования')
    )
    confirmation_deadline = models.DateTimeField(null=True, blank=True, verbose_name=_('дедлайн подтверждения'))
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('подтверждено в'))
    confirmed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_tickets',
        verbose_name=_('подтвердил')
    )
    rejection_reason = models.TextField(blank=True, null=True, verbose_name=_('причина отказа'))

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


class Hotel(models.Model):
    """
    Модель отеля (Legacy: tb_hotels_old).
    """
    region = models.ForeignKey(
        'locations.Region',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotels',
        verbose_name=_('регион')
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='hotels',
        null=True,
        blank=True,
        verbose_name=_('вендор')
    )
    name = models.CharField(max_length=255, verbose_name=_('название'))
    name_ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (RU)'))
    name_uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('название (UZ)'))
    description = models.TextField(blank=True, null=True, verbose_name=_('описание'))
    description_ru = models.TextField(blank=True, null=True, verbose_name=_('описание (RU)'))
    description_uz = models.TextField(blank=True, null=True, verbose_name=_('описание (UZ)'))
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('адрес'))
    geolocation = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('геолокация'))
    
    # Rating/Stars
    stars = models.IntegerField(default=0, verbose_name=_('количество звезд'))
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, verbose_name=_('рейтинг пользователей'))
    
    # e-mehmon Integration
    emehmon_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name=_('ID в e-mehmon'))
    
    # Pricing (Legacy)
    deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('депозит (цена)'))
    deposit_turizm = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('депозит (туризм)'))

    # Images
    image_id = models.IntegerField(null=True, blank=True, verbose_name=_('ID главного фото (Legacy)'))
    banner_image_id = models.IntegerField(null=True, blank=True, verbose_name=_('ID баннера (Legacy)'))
    gallery = models.TextField(blank=True, null=True, verbose_name=_('галерея (IDs через запятую)'))
    images = models.TextField(blank=True, null=True, verbose_name=_('изображения (пути через запятую)'))

    # JSON Fields (Amenities etc)
    amenities_services = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('удобства и услуги'))
    safety = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('безопасность'))
    payment_methods = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('способы оплаты'))
    staff_languages = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('языки персонала'))
    activities = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('развлечения'))
    services = models.JSONField(default=dict, blank=True, null=True, verbose_name=_('сервисы'))
    
    # Meta / Admin
    hotel_type_id = models.IntegerField(null=True, blank=True, verbose_name=_('ID типа отеля (Legacy)'))

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_hotels',
        verbose_name=_('создал')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('активен'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_hotels_old'
        verbose_name = _('отель')
        verbose_name_plural = _('отели')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.name

    def get_images_list(self):
        """
        Возвращает список URL изображений.
        1. Если есть поле images (новые пути), использует его.
        2. Иначе собирает ID из image_id, banner_image_id, gallery и ищет в MediaFile.
        """
        if self.images:
            # Если пути уже есть (новые или мигрированные)
            raw = [x.strip() for x in self.images.split(',') if x.strip()]
            return [
                f"/media/{img.lstrip('/')}" if not img.startswith(('/media/', 'http')) else img
                for img in raw
            ]
            
        # Legacy Mode: Collect IDs
        ids = []
        if self.image_id:
            ids.append(self.image_id)
        if self.banner_image_id:
            ids.append(self.banner_image_id)
        if self.gallery:
            try:
                ids.extend([int(x.strip()) for x in self.gallery.split(',') if x.strip()])
            except:
                pass
        
        ids = list(set(ids))
        if not ids:
            return []

        # Fetch Paths from MediaFile
        from vendors.models import MediaFile
        media_files = MediaFile.objects.filter(id__in=ids).values('id', 'file_path')
        media_map = {m['id']: m['file_path'] for m in media_files if m['file_path']}
        
        final_paths = []
        
        # Helper to add path
        def add_path(img_id):
            if img_id in media_map:
                path = media_map[img_id]
                # Format logic: assume file_path is relative to public/ or storage/
                # Check if it implies 'images/' or 'uploads/'
                # Usually legacy paths are like 'uploads/users/...'
                final_path = f"/media/{path.lstrip('/')}" if not path.startswith(('/media/', 'http')) else path
                if final_path not in final_paths:
                    final_paths.append(final_path)

        # 1. Main Image
        if self.image_id:
            add_path(self.image_id)
            
        # 2. Banner
        if self.banner_image_id:
            add_path(self.banner_image_id)
            
        # 3. Gallery (rest)
        for i in ids:
            add_path(i)
            
        return final_paths


class RoomType(models.Model):
    """
    Тип комнаты (Legacy: tb_room_types).
    """
    en = models.CharField(max_length=255, verbose_name=_('type_en'))
    ru = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('type_ru'))
    uz = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('type_uz'))
    
    # e-mehmon / Enterprise fields
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='enterprise_room_types', null=True, verbose_name=_('отель'))
    capacity = models.PositiveIntegerField(default=1, verbose_name=_('вместимость'))
    price_ref = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('базовая цена (ref)'))
    emehmon_id = models.CharField(max_length=255, blank=True, null=True, verbose_name=_('ID в e-mehmon'))

    class Meta:
        db_table = 'tb_room_types'
        verbose_name = _('тип комнаты')
        verbose_name_plural = _('типы комнат')

    def __str__(self):
        return self.en


class Room(models.Model):
    """
    Комната (Legacy: tb_rooms).
    """
    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name='rooms',
        verbose_name=_('отель')
    )
    room_type = models.ForeignKey(
        RoomType,
        on_delete=models.CASCADE,
        related_name='rooms',
        verbose_name=_('тип комнаты')
    )
    
    # Legacy fields
    aircond = models.BooleanField(default=False, verbose_name=_('кондиционер'))
    wifi = models.BooleanField(default=False, verbose_name=_('wifi'))
    tvset = models.BooleanField(default=False, verbose_name=_('тв'))
    freezer = models.BooleanField(default=False, verbose_name=_('холодильник'))
    
    active = models.BooleanField(default=True, verbose_name=_('активна'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))

    class Meta:
        db_table = 'tb_rooms'
        verbose_name = _('комната')
        verbose_name_plural = _('комнаты')

    def __str__(self):
        return f'{self.hotel.name} - {self.room_type.en} (#{self.id})'


    def __str__(self):
        return f'{self.hotel.name} - {self.room_type.en} (#{self.id})'


class RoomPrice(models.Model):
    """
    Цена комнаты по датам (Legacy: tb_room_prices).
    """
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='room_prices', verbose_name=_('отель'))
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='prices', verbose_name=_('тип комнаты'))
    # Legacy uses 'dt' for date
    dt = models.DateField(verbose_name=_('дата'))
    usd = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена USD'))
    uzs = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('цена UZS'))
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tb_room_prices'
        verbose_name = _('цена комнаты')
        verbose_name_plural = _('цены комнат')
        ordering = ['-dt']

    def __str__(self):
        return f'{self.hotel} / {self.room_type} @ {self.dt} = ${self.usd}'


class Booking(models.Model):
    """
    Бронирование (Legacy: tb_bookings).
    """
    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('отель')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotel_bookings',
        verbose_name=_('пользователь')
    )
    
    guest_name = models.CharField(max_length=255, verbose_name=_('имя гостя'))
    guest_email = models.EmailField(max_length=255, verbose_name=_('email гостя'))
    guest_phone = models.CharField(max_length=50, verbose_name=_('телефон гостя'))
    
    check_in = models.DateField(verbose_name=_('заезд'))
    check_out = models.DateField(verbose_name=_('выезд'))
    
    adults = models.IntegerField(default=1, verbose_name=_('взрослых'))
    children = models.IntegerField(default=0, verbose_name=_('детей'))
    
    total_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('общая цена'))
    
    # Statuses
    payment_status = models.CharField(
        max_length=50, 
        default='pending',
        verbose_name=_('статус оплаты')
    )
    booking_status = models.CharField(
        max_length=50, 
        default='pending',
        verbose_name=_('статус бронирования')
    )
    
    # Confirmation fields
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('подтверждено в'))
    confirmed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_bookings',
        verbose_name=_('подтвердил')
    )
    rejection_reason = models.TextField(blank=True, null=True, verbose_name=_('причина отказа'))

    selected_rooms_json = models.JSONField(verbose_name=_('выбранные комнаты (JSON)'))
    special_requests = models.TextField(blank=True, null=True, verbose_name=_('особые пожелания'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_bookings'
        verbose_name = _('бронирование')
        verbose_name_plural = _('бронирования')
        ordering = ['-created_at']

    def __str__(self):
        return f'Booking #{self.id} - {self.guest_name}'


class TicketDetail(models.Model):
    """
    Детали билета на каждого гостя (Legacy: tb_ticket_details).
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='details',
        verbose_name=_('билет')
    )
    # Fields matching logic from Laravel
    guest_name = models.CharField(max_length=255, verbose_name=_('имя гостя'))
    guest_info = models.JSONField(default=dict, verbose_name=_('информация о госте (JSON)'))
    
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_('сумма'))
    
    hash = models.CharField(max_length=255, unique=True, verbose_name=_('хэш билета'))
    status = models.CharField(
        max_length=50, 
        default='active', 
        choices=[('active', 'Active'), ('used', 'Used'), ('expired', 'Expired')],
        verbose_name=_('статус')
    )
    
    valid_until = models.DateTimeField(null=True, blank=True, verbose_name=_('действителен до'))
    used_at = models.DateTimeField(null=True, blank=True, verbose_name=_('использован'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_ticket_details'
        verbose_name = _('деталь билета')
        verbose_name_plural = _('детали билетов')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.guest_name} ({self.status})'


class HotelComment(models.Model):
    """
    Комментарий/отзыв об отеле (Legacy: tb_hotel_comment).
    """
    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name='comments',
        null=True,
        blank=True,
        verbose_name=_('отель')
    )
    sight = models.ForeignKey(
        Sight,
        on_delete=models.CASCADE,
        related_name='comments',
        null=True,
        blank=True,
        verbose_name=_('достопримечательность')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='hotel_comments',
        verbose_name=_('пользователь')
    )
    rating = models.IntegerField(
        default=5,
        choices=[(i, str(i)) for i in range(1, 6)],
        verbose_name=_('рейтинг')
    )
    comment = models.TextField(verbose_name=_('комментарий'))
    status = models.CharField(
        max_length=20,
        default='pending',
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        verbose_name=_('статус модерации')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('создано'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('обновлено'))

    class Meta:
        db_table = 'tb_hotel_comment'
        verbose_name = _('комментарий об отеле')
        verbose_name_plural = _('комментарии об отелях')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.name} - {self.hotel.name} ({self.rating}/5)'