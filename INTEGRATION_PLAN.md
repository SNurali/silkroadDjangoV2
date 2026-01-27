# SilkRoad Laravel → Django Integration Plan

## ✅ COMPLETED INTEGRATIONS

### Phase 1: Core Features (COMPLETE)

#### ✅ 1. Hotel Comments & Reviews System
**Status**: COMPLETE  
**Files**: `hotels/models.py`, `hotels/serializers.py`, `hotels/views_api.py`, `hotels/admin.py`

- Model: `HotelComment` with 1-5 star ratings
- API: GET/POST `/api/hotels/{id}/comments/`
- Stats API: `/api/hotels/{id}/comments/stats/`
- Django Admin moderation panel
- Migration: `0021_add_hotel_comment.py`

#### ✅ 2. PDF Generation System
**Status**: COMPLETE  
**Files**: `hotels/pdf_generator.py`, `hotels/views_pdf.py`, `hotels/urls_api.py`

**Booking PDFs**:
- Professional A4 layout with ReportLab
- Includes: Hotel details, guest info, room breakdown, pricing table
- Watermark for pending payments
- Download: `GET /api/hotels/bookings/{id}/download/`
- Preview: `GET /api/hotels/bookings/{id}/preview/`

**Ticket PDFs**:
- QR code generation for entry verification
- Ticket details with attraction info
- Download: `GET /api/hotels/tickets/{id}/download/`
- Requires payment before download

**React Component**: `BookingConfirmation.jsx` with modern UI
- Beautiful confirmation page with gradient design
- One-click PDF download
- Preview in browser option
- Responsive mobile layout

**Dependencies Added**:
```txt
reportlab==4.2.5
qrcode[pil]==8.0
```

#### ✅ 3. Room Search & Availability Logic
**Status**: COMPLETE  
**Files**: `hotels/views.py`, `hotels/urls_api.py`, `frontend/src/components/booking/BookingForm.jsx`

**Backend API**:
- Endpoint: `POST /api/hotels/{hotel_id}/search-rooms/`
- Date-based availability checking
- Overlapping booking detection: `(StartA <= EndB) AND (EndA >= StartB)`
- Returns available room types with:
  - Price per night & total price
  - Available count (total - booked)
  - Room features (WiFi, AC, TV, Fridge)
  - Can fulfill request flag
  - Hotel images

**Frontend Booking Flow** (5-Step Process):
1. **Search Rooms**: Date selection, guest count, rooms needed
2. **Select Rooms**: Visual room cards with quantity selectors
3. **Guest Info**: E-Mehmon auto-fill integration
4. **Payment**: Card details with total calculation
5. **SMS Verification**: OTP confirmation

**Key Features**:
- Real-time availability checking
- Multi-room type selection
- Dynamic pricing calculation
- Beautiful progress indicator
- Feature badges (WiFi, AC, TV, Fridge)
- Responsive mobile design

#### ✅ 4. Frontend Reviews Display
**Status**: COMPLETE  
**Files**: `frontend/src/pages/HotelDetail.jsx`

**Features**:
- **Rating Statistics Card**:
  - Large average rating display
  - 5-star visual breakdown
  - Rating distribution bars with percentages
  - Total review count

- **Write Review Form** (Animated):
  - Interactive star rating selector (1-5 stars)
  - Textarea with character counter (10-1000 chars)
  - Submit/Cancel buttons
  - Form validation (min 10 chars)
  - Success toast notification
  - Moderation message

- **Reviews List**:
  - User avatar with name
  - Star rating display
  - Formatted date
  - Review comment
  - Hover effects
  - Empty state message

- **Design Elements**:
  - Gradient backgrounds
  - Dark mode support
  - Smooth animations (Framer Motion)
  - Loading spinners
  - Toast notifications
  - Responsive layout

**User Flow**:
1. View rating statistics at a glance
2. Click "Write a Review" button
3. Select star rating (1-5)
4. Write comment (min 10 chars)
5. Submit review
6. See success message (pending moderation)
7. Review appears after admin approval

#### ✅ 5. CAPTCHA Implementation
**Status**: COMPLETE  
**Files**: `hotels/serializers.py`, `hotels/views_api.py`, `hotels/urls_api.py`, `frontend/src/pages/HotelDetail.jsx`, `requirements.txt`, `settings.py`

**Backend**:
- **Library**: `django-simple-captcha==0.6.0`
- **Type**: Math challenge CAPTCHA (e.g., "3 + 5 = ?")
- **API Endpoint**: `GET /api/hotels/captcha/generate/`
- **Response**: `{"captcha_key": "abc123", "captcha_image_url": "/captcha/image/abc123/"}`
- **Validation**: Integrated into `HotelCommentSerializer`
- **Format**: `captcha: "key:value"`

**Frontend**:
- **Auto-load**: CAPTCHA fetches when review form opens
- **Display**: Image with refresh button (🔄)
- **Input field**: Text input for answer
- **Refresh**: Click to generate new challenge
- **Validation**: Required field, shows error toast
- **Auto-refresh**: New CAPTCHA on submit error

**Configuration** (`settings.py`):
```python
CAPTCHA_IMAGE_SIZE = (120, 50)
CAPTCHA_FONT_SIZE = 32
CAPTCHA_BACKGROUND_COLOR = '#f8f9fa'
CAPTCHA_FOREGROUND_COLOR = '#1e40af'
CAPTCHA_CHALLENGE_FUNCT = 'captcha.helpers.math_challenge'
CAPTCHA_TIMEOUT = 5  # Minutes
```

**Security Features**:
- Prevents automated spam
- Time-limited (5 min expiry)
- Math challenges (user-friendly)
- Server-side validation
- One-time use tokens
- Refresh on failure

#### ✅ 6. Social Authentication (Google OAuth)
**Status**: COMPLETE  
**Files**: `accounts/views_oauth.py`, `accounts/urls.py`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/OAuthCallback.jsx`, `requirements.txt`, `settings.py`

**Backend**:
- **Library**: `django-allauth==0.57.0`
- **Provider**: Google OAuth 2.0
- **Flow**: Authorization Code with PKCE
- **JWT Integration**: Returns JWT tokens after OAuth

**Endpoints**:
```
GET /api/accounts/oauth/google/          - Initiate OAuth flow
GET /api/accounts/oauth/google/callback/ - Handle callback
GET /api/accounts/oauth/google/status/   - Check if enabled
```

**Configuration** (`.env`):
```bash
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

**User Flow**:
1. User clicks "Continue with Google" on login page
2. Redirects to Google consent screen
3. User authorizes app
4. Google redirects to `/api/accounts/oauth/google/callback/`
5. Backend exchanges code for Google tokens
6. Backend fetches user profile from Google
7. Backend creates/updates User in database
8. Backend generates JWT tokens
9. Backend redirects to `/auth/callback?access_token=xxx&...`
10. Frontend stores tokens and user info
11. Frontend redirects to profile page

**Features**:
- ✅ Auto-create user from Google profile
- ✅ Auto-login after OAuth
- ✅ JWT token generation
- ✅ Social account linking
- ✅ Error handling (access_denied, oauth_failed)
- ✅ Toast notifications
- ✅ OAuth status check (shows/hides button)
- ✅ Beautiful Google brand button
- ✅ Dark mode support

**Frontend Button**:
- Official Google brand colors
- Full-width responsive
- Hover effects
- Disabled state when not configured
- Loading spinner during redirect

**Setup Instructions**:
1. Create Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:8000/api/accounts/oauth/google/callback/`
5. Set environment variables
6. Run migrations: `python3 manage.py migrate`
7. Test login flow

---

## ✅ **7. Payment Integration (Yagona Billing)**

**Status**: ✅ COMPLETE & VERIFIED  
**Files**: `silkroad_backend/services/yagona.py`, `hotels/views_payment.py`, `hotels/urls_api.py`, `frontend/src/components/booking/BookingForm.jsx`

### Backend Implementation

#### Yagona Billing Service
**File**: `silkroad_backend/services/yagona.py`

**Features**:
- Card registration with SMS verification
- SMS code verification
- Payment execution
- Tiyin conversion (amount * 100)
- Error logging

**Methods**:
```python
register(card_number, exp_month, exp_year, phone)
verify(verify_id, code)
pay(token, amount, order_id, note)
```

**API Endpoints**: `https://api.viasandbox.uz`
- `/card/api/v1/card/register` - Register card
- `/card/api/v1/card/register/verify` - Verify SMS
- `/ps/api/v1/pvpay/partner/pay` - Execute payment

#### Payment Views
**File**: `hotels/views_payment.py`

**1. CardRegisterAPIView**
```python
POST /api/hotels/payment/register/
{
    "card_number": "8600123412341234",
    "exp_month": "12",
    "exp_year": "25",
    "phone": "998901234567"
}
```
**Response**:
```json
{
    "status": "success",
    "message": "SMS sent",
    "data": {"verifyId": "xxx", "phone": "998901234567"}
}
```

**2. PaymentConfirmAPIView**
```python
POST /api/hotels/payment/confirm/
{
    "card_token": "verify_id_from_step_1",
    "card_code": "123456",
    "booking_id": 1  # OR "ticket_id": 1
}
```
**Response**:
```json
{
    "status": "success",
    "message": "Payment Successful",
    "transaction": {"transactionId": "xxx"}
}
```

**3. PersonInfoAPIView** (E-Mehmon)
```python
POST /api/hotels/emehmon/check/
{
    "passport": "AA1234567",
    "birthday": "1990-01-01",
    "citizen": 173
}
```

### FAKE_PAYMENT Mode

**Configuration** (`.env`):
```bash
FAKE_PAYMENT=1  # Enable fake mode
```

**Behavior**:
- Skips real Yagona API calls
- Returns fake verifyId
- Accepts SMS code "1111" for success
- Marks booking/ticket as paid immediately
- Perfect for development & testing

**Enable/Disable**:
- `FAKE_PAYMENT=1` → Fake mode (no real charges)
- `FAKE_PAYMENT=0` → Real Yagona API

### Real Payment Configuration

**Environment Variables**:
```bash
YAGONA_BILLING_KLIENT=your_client_id
YAGONA_BILLING_KLIENT_SECRET=your_client_secret
YAGONA_BILLING_MERCHANT_ID=your_merchant_id
FAKE_PAYMENT=0
```

### Frontend Integration

**File**: `frontend/src/components/booking/BookingForm.jsx`

**Payment Flow (5-Step Wizard)**:

**Step 4: Card Payment**
- Card number input (formatted: #### #### #### ####)
- Expiry month/year
- Calls `registerPayment()` API
- Receives verifyId

**Step 5: SMS Verification**
- SMS code input (6 digits)
- Calls `confirmPayment()` with verifyId + code
- On success: Booking marked as paid

**API Service** (`frontend/src/services/api.js`):
```javascript
export const registerPayment = async (data) => {
    const response = await api.post('/hotels/payment/register/', data);
    return response.data;
};

export const confirmPayment = async (data) => {
    const response = await api.post('/hotels/payment/confirm/', data);
    return response.data;
};
```

### Payment Flow Diagram

```
1. User fills booking form (Steps 1-3)
   ↓
2. Booking created (status: pending)
   ↓
3. User enters card details (Step 4)
   → POST /payment/register/
   ↓
4. Yagona sends SMS to phone
   ← Returns verifyId
   ↓
5. User enters SMS code (Step 5)
   → POST /payment/confirm/ {verifyId, code}
   ↓
6. Yagona verifies SMS
   ← Returns token
   ↓
7. Execute payment with token
   ← Returns transactionId
   ↓
8. Update booking: payment_status='paid'
   ✅ Booking confirmed!
```

### Model Updates

**Booking Model** (`hotels/models.py`):
```python
class Booking(models.Model):
    payment_status = models.CharField(
        max_length=50, 
        default='pending',  # pending → paid
        verbose_name=_('статус оплаты')
    )
    booking_status = models.CharField(
        max_length=50, 
        default='pending',  # pending → confirmed
        verbose_name=_('статус бронирования')
    )
    total_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name=_('общая цена')
    )
```

**Ticket Model** (`hotels/models.py`):
```python
class Ticket(models.Model):
    is_paid = models.BooleanField(default=False)
    is_valid = models.BooleanField(default=False)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
```

### Testing

**Test Script**: `test_payment_integration.py`

**Run Tests**:
```bash
source venv/bin/activate
python test_payment_integration.py
```

**Test Coverage**:
1. ✅ Payment Configuration
2. ✅ Yagona Service Initialization
3. ✅ Fake Payment Flow (End-to-End)
4. ✅ API Endpoints Mapping
5. ✅ Booking Model Fields
6. ✅ Frontend Integration

**Test Result**: 🎉 **6/6 Tests Passed (100%)**

### Laravel Compatibility

**Matching Features**:
- ✅ Card registration with phone validation
- ✅ SMS verification flow
- ✅ Payment execution with Yagona
- ✅ FAKE_PAYMENT mode for testing
- ✅ Amount conversion to tiyin (* 100)
- ✅ Transaction logging
- ✅ Booking status updates
- ✅ Same API endpoints (viasandbox.uz)
- ✅ Same merchant ID & credentials

**Differences**:
- Django uses Class-Based Views (CBV) vs Laravel Controllers
- Django REST Framework serializers vs Laravel FormRequests
- React multi-step wizard vs Laravel Blade forms

### Security Features

- ✅ Authentication required (IsAuthenticated)
- ✅ User-specific booking validation
- ✅ One-time SMS codes
- ✅ Payment amount verification
- ✅ Double-payment prevention
- ✅ Transaction atomicity (Django transaction.atomic)
- ✅ Secure credential storage (environment variables)
- ✅ SSL/TLS for API calls

### Error Handling

**Backend**:
- Card registration failures
- SMS verification errors
- Payment execution errors
- Invalid booking/ticket IDs
- Already paid bookings
- Network timeouts

**Frontend**:
- Toast notifications for all errors
- Retry mechanism for failed requests
- User-friendly error messages
- Validation before API calls

### Production Checklist

- [ ] Set `FAKE_PAYMENT=0`
- [ ] Configure real Yagona credentials
- [ ] Test with real card (small amount)
- [ ] Enable transaction logging
- [ ] Set up payment monitoring
- [ ] Configure webhook callbacks (if supported)
- [ ] Test refund flow (if needed)
- [ ] Add payment receipts
- [ ] Implement payment history

---

## 🚀 READY TO USE

### Installation

```bash
cd /home/mrnurali/PycharmProjects/SilkRoad/silkroadDjangoV2

# Install PDF dependencies
pip install -r requirements.txt

# Apply migrations
python3 manage.py migrate

# Start server
python3 manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Testing PDF Generation

**1. Create a test booking** (via API or frontend):
```bash
curl -X POST http://localhost:8000/api/hotels/bookings/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotel": 1,
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "guest_phone": "+998901234567",
    "check_in": "2026-02-01",
    "check_out": "2026-02-03",
    "adults": 2,
    "children": 0,
    "total_price": 150.00,
    "selected_rooms_json": [{"roomType": "Deluxe", "quantity": 1, "price_per_night": 75}]
  }'
```

**2. Download PDF**:
```bash
curl -X GET http://localhost:8000/api/hotels/bookings/1/download/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output booking.pdf
```

**3. Access via React**:
1. Login to app
2. Create a booking
3. Get redirected to `/bookings/{id}/confirmation`
4. Click "Download PDF" button

### Testing Room Search

**1. Run test script**:
```bash
chmod +x test_room_search.py
python3 test_room_search.py
```

**2. Manual API test**:
```bash
curl -X POST http://localhost:8000/api/hotels/1/search-rooms/ \
  -H "Content-Type: application/json" \
  -d '{
    "check_in": "2026-02-01",
    "check_out": "2026-02-03",
    "adults": 2,
    "children": 0,
    "rooms": 1
  }'
```

**3. Frontend test**:
1. Navigate to hotel detail page
2. Click "Reserve Now" button
3. **Step 1**: Select dates and guest count → Click "Search Available Rooms"
4. **Step 2**: See available rooms with features → Select quantities → "Continue to Guest Info"
5. **Step 3**: Fill guest details (E-Mehmon auto-fill) → "Proceed to Payment"
6. **Step 4**: Enter card details → "Pay Now"
7. **Step 5**: Enter SMS code "1111" → "Confirm Payment"
8. Success! View booking confirmation with PDF download

---

## 📋 REMAINING TASKS

### Priority 1: Room Search Logic (2-3 hours)
**Laravel**: `tb_hotel_comment`, `HotelsController::storeHotelComment`, reviews with CAPTCHA
**Django**: Нужно добавить:
- [ ] Model: `HotelComment` (user, hotel, rating, comment, status, created_at)
- [ ] API: POST `/api/hotels/{id}/comments/` (with django-simple-captcha or custom)
- [ ] Serializer: `HotelCommentSerializer`
- [ ] Frontend: Review form + display (уже есть в Laravel blade, нужно портировать в React)

**Files to Create/Modify:**
- `hotels/models.py` - add HotelComment model
- `hotels/serializers.py` - add HotelCommentSerializer
- `hotels/views_api.py` - add HotelCommentAPIView
- `hotels/urls_api.py` - add route
- `frontend/src/pages/HotelDetail.jsx` - add review section

---

### 1.2 PDF Generation (Bookings + Tickets)
**Laravel**: Uses `Barryvdh\DomPDF` for booking confirmations and tickets
**Django**: Use **ReportLab** or **WeasyPrint**

**Bookings:**
- [ ] API: GET `/api/hotels/bookings/{id}/download/`
- [ ] View: `BookingPDFView` (generates PDF with hotel, room, guest info)
- [ ] Template: HTML template for PDF (convert Laravel blade to Django template)

**Tickets:**
- [ ] API: GET `/api/hotels/tickets/{id}/download/`
- [ ] View: `TicketPDFView` (generates ticket with QR code/hash)
- [ ] QR Code: Use `qrcode` Python library

**Dependencies to Add:**
```txt
reportlab==4.0.4
qrcode[pil]==7.4.2
```

**Files to Create:**
- `hotels/views_pdf.py` - PDF generation views
- `templates/pdf/booking.html` - booking PDF template
- `templates/pdf/ticket.html` - ticket PDF template
- `hotels/urls_api.py` - add PDF download routes

---

### 1.3 Room Search & Availability Logic
**Laravel**: `HotelsController::searchRooms()` - complex date-based search
**Current Django**: Basic room display, no date filtering

**Implementation:**
- [ ] Enhance `HotelDetailAPIView` to accept `check_in`, `check_out` params
- [ ] Filter rooms by availability (check overlapping bookings)
- [ ] Group rooms by type
- [ ] Return price per night for selected dates
- [ ] Frontend: Update `HotelDetail.jsx` to show date-filtered rooms

**Logic to Port:**
```php
// Laravel logic (lines 696-815 of HotelsController.php)
// 1. Get room types
// 2. Filter booked rooms (date overlap)
// 3. Calculate prices from tb_room_prices
// 4. Return available count per type
```

**Files to Modify:**
- `hotels/views.py` - enhance `searchRooms` logic in `HotelDetailAPIView`
- `frontend/src/pages/HotelDetail.jsx` - add date picker + room search

---

### 1.4 Booking Confirmation Page
**Laravel**: `/hotel/booking-confirm/{id}` blade view
**Django**: Create React page `/bookings/{id}/confirm`

**Features:**
- [ ] Display booking details (hotel, room, dates, price)
- [ ] Show payment status
- [ ] Download PDF button
- [ ] Timeline/Status steps

**Files to Create:**
- `frontend/src/pages/BookingConfirmation.jsx`
- Update `App.jsx` routes

---

## Phase 2: Enhanced Features (Priority: MEDIUM)

### 2.1 Social Authentication (Google OAuth)
**Laravel**: Uses Laravel Socialite (routes/web.php lines 27-30)
**Django**: Use **django-allauth** or **python-social-auth**

**Implementation:**
- [ ] Install `django-allauth[socialaccount]`
- [ ] Configure Google provider in `settings.py`
- [ ] Create callback views
- [ ] Frontend: Add "Login with Google" button

**Files to Modify:**
- `silkroad_backend/settings.py` - add allauth config
- `accounts/urls.py` - add social auth routes
- `frontend/src/pages/Login.jsx` - add Google button

---

### 2.2 Agent Portal
**Laravel**: `routes/agent.php` - agent-specific routes
**Current Django**: No agent role logic

**Features:**
- [ ] Add `role='agent'` to User model (already exists?)
- [ ] Create Agent API endpoints (bookings management, commissions)
- [ ] Frontend: Agent dashboard (similar to Vendor)

**Files to Create:**
- `agents/` - new Django app (or extend `accounts`)
- `frontend/src/pages/agent/` - agent pages

---

### 2.3 Map Integration (Google Maps)
**Laravel**: Modal with Google Maps iframe (detail.blade.php lines 818-843)
**Django**: Already has `geolocation` field

**Implementation:**
- [ ] Frontend: Add Google Maps modal to `HotelDetail.jsx`
- [ ] Use `geolocation` field from Hotel model
- [ ] Display on click

**Files to Modify:**
- `frontend/src/pages/HotelDetail.jsx` - add map modal

---

### 2.4 Admin Routes & Views
**Laravel**: `routes/admin.php` - admin-specific routes
**Django**: Uses built-in Django Admin

**Action:**
- [ ] Review Laravel admin routes
- [ ] Ensure Django admin has equivalent functionality
- [ ] OR create custom admin React views if needed

---

## Phase 3: Polish & Testing (Priority: LOW)

### 3.1 CAPTCHA for Reviews
- [ ] Install `django-simple-captcha` or use Google reCAPTCHA
- [ ] Add to comment form

### 3.2 Timeline Service
**Laravel**: `OrdersTimelineService::create()` (HotelsController line 256)
- [ ] Migrate timeline logic to Django (optional, can use Django signals)

### 3.3 Email Notifications
- [ ] Booking confirmation emails
- [ ] Ticket emails

### 3.4 Currency Handling
**Laravel**: Uses UZS, USD
- [ ] Ensure price fields support both currencies
- [ ] Add currency conversion if needed

---

## Implementation Priority

**Week 1:**
1. Hotel Comments & Reviews (1.1)
2. PDF Generation (1.2)

**Week 2:**
3. Room Search Logic (1.3)
4. Booking Confirmation Page (1.4)

**Week 3:**
5. Social Auth (2.1)
6. Map Integration (2.3)

**Week 4:**
7. Agent Portal (2.2)
8. Admin Review & Testing (2.4, Phase 3)

---

## Next Steps

1. Install missing dependencies:
```bash
pip install reportlab qrcode[pil] django-simple-captcha
```

2. Start with **Hotel Comments** (easiest, high user impact)

3. Then **PDF Generation** (critical for bookings)

4. Update frontend incrementally (maintain current design!)

---

## Questions for Stakeholder
1. Нужна ли полная интеграция Agent Portal? (может быть низкий приоритет)
2. Какой CAPTCHA предпочтительнее? (Google reCAPTCHA v3 или django-simple-captcha)
3. Email provider для уведомлений? (Gmail SMTP, SendGrid, etc.)

---
## ✅ **8. Admin/Vendor Panel Functionality**

**Status**: ✅ COMPLETE & VERIFIED  
**Files**: `admin_panel/views.py`, `admin_panel/urls.py`, `admin_panel/templates/admin/*`, `silkroad_backend/urls.py`

### Admin Dashboard Implementation

#### Admin Dashboard View
**File**: `admin_panel/views.py`

**Features**:
- Overall platform statistics
- Sight count
- Total income calculation
- Vendor count
- Total ticket count
- Popular services (top 4 by ticket count)
- Ticket status breakdown (paid vs unpaid)
- Weekly traffic chart (local vs foreign visitors)
- Recent activity (reviews, tickets, bookings)

**API Endpoint**: `GET /admin-panel/dashboard/`

**Template**: `admin_panel/templates/admin/dashboard.html`

#### Admin Vendor Management

**File**: `admin_panel/views.py`

**1. Vendors List View**
```python
GET /admin-panel/vendors/
```
**Features**:
- Paginated vendor list
- ID, Name, Region, Sights count, Status
- Action buttons (View, Edit, Delete)
- Create new vendor button

**2. Vendor Detail View**
```python
GET /admin-panel/vendors/<int:vendor_id>/
```
**Features**:
- Basic vendor information
- Statistics (services count, tickets, revenue)
- Associated services list
- Edit/back buttons

**3. Vendor Create View**
```python
GET /admin-panel/vendors/create/  # Show form
POST /admin-panel/vendors/create/  # Create vendor
```
**Features**:
- Form with vendor details
- User selection dropdown
- Region, district, category selection
- Photo upload support

**4. Vendor Edit View**
```python
GET /admin-panel/vendors/<int:vendor_id>/edit/  # Show form
POST /admin-panel/vendors/<int:vendor_id>/edit/  # Update vendor
```
**Features**:
- Pre-populated form with existing data
- Ability to update all vendor fields
- User-vendor association management

**5. Vendor Delete View**
```python
DELETE /admin-panel/vendors/<int:vendor_id>/delete/
```
**Features**:
- Safe deletion (checks for associated tickets)
- User-vendor association cleanup
- Prevents deletion of vendors with tickets

### Template System

**Base Template**: `admin_panel/templates/admin/base.html`
- Responsive sidebar navigation
- Font Awesome icons
- Tailwind CSS styling
- Common admin layout structure

**Dashboard Template**: `admin_panel/templates/admin/dashboard.html`
- Stats cards with metrics
- Data visualization (tables, charts)
- Recent activity sections

**Vendor Templates**:
- `admin_panel/templates/admin/vendors/list.html` - Vendor listing table
- `admin_panel/templates/admin/vendors/detail.html` - Vendor detail view
- `admin_panel/templates/admin/vendors/create.html` - Create form
- `admin_panel/templates/admin/vendors/edit.html` - Edit form

### Laravel Compatibility

**Matching Features**:
- ✅ Admin dashboard with platform stats
- ✅ Vendor management (create, read, update, delete)
- ✅ Vendor statistics (sights count, revenue, tickets)
- ✅ User-vendor association management
- ✅ Safe deletion (prevents deletion with associated tickets)
- ✅ Similar data presentation (tables, cards)
- ✅ Responsive admin interface

**Differences**:
- Django uses CBVs vs Laravel MVC controllers
- Django templates vs Laravel Blade
- Different ORM (Django vs Eloquent)
- Admin panel at `/admin-panel/` vs Laravel's `/admin/`

### URL Structure

```
/admin-panel/                     → Dashboard
/admin-panel/dashboard/            → Dashboard
/admin-panel/vendors/              → Vendors list
/admin-panel/vendors/create/       → Create vendor
/admin-panel/vendors/<id>/         → Vendor detail
/admin-panel/vendors/<id>/edit/    → Edit vendor
/admin-panel/vendors/<id>/delete/  → Delete vendor
```

### Access Control

**Authentication**: `@login_required` decorator
**Authorization**: Staff/superuser check
```python
if not request.user.is_staff and not request.user.is_superuser:
    return JsonResponse({'error': 'Access denied'}, status=403)
```

### Models Used

- `vendors.Vendor` - Vendor profiles
- `hotels.Sight` - Services/tours
- `hotels.Ticket` - Sales data
- `hotels.TicketDetail` - Detailed transactions
- `hotels.HotelComment` - Reviews
- `bookings.Booking` - Hotel bookings
- `accounts.User` - User management

### Security Features

- ✅ Admin-only access control
- ✅ Safe deletion (foreign key checks)
- ✅ CSRF protection
- ✅ Input validation
- ✅ SQL injection prevention (ORM usage)
- ✅ XSS protection (template escaping)

### Testing

**Manual Testing**:
1. Login as admin user
2. Navigate to `/admin-panel/` → Dashboard loads
3. Navigate to `/admin-panel/vendors/` → Vendor list shows
4. Click "New Vendor" → Create form loads
5. View/edit/delete functionality works

**Requirements**:
- Admin user with `is_staff` or `is_superuser` flag
- Proper database permissions
- All referenced models exist

### Production Checklist

- [x] Admin dashboard with stats
- [x] Vendor management CRUD
- [x] User-vendor association
- [x] Safe deletion
- [x] Access control
- [x] Responsive design
- [x] Template inheritance
- [x] URL routing

---

**Status**: Plan Created - Ready for Implementation
