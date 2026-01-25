# SilkRoad Modernization - Walkthrough

## 1. Launch / Запуск

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for dev)

### Backend (Django)
```bash
source venv/bin/activate
python manage.py runserver
```
Runs on: `http://127.0.0.1:8000/`

### Frontend (React + Vite)
```bash
cd silkroad-frontend
npm install
npm run dev
```
Runs on: `http://localhost:5173/`

---

## 2. Main Pages / Основные Страницы

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero section, search bar, featured hotels. **Public access** (no login required). |
| **Search/List** | `/hotels?location=...` | Horizontal card list of hotels. Filters by location/price/amenities. |
| **Hotel Detail** | `/hotels/:id` | **Legacy Grid Gallery** (1 Main + 3 Small + View All). Shows Amenities, Safety, Payment info. |
| **Profile** | `/profile` | User dashboard. Personal Info form (Passport, Nationality, DOB) + **Photo Gallery**. |
| **Vendor Portal** | `/vendor` | Vendor-specific stats and gallery management. |

---

## 3. New Features / Новые Фичи

### 🎨 UI/UX
-   **Dark Mode**: Toggle in Navbar (Sun/Moon). Persisted in `localStorage`.
-   **Hotel Gallery**: Restored the "Grid" layout from the legacy Laravel site.
-   **Hotel List**: Horizontal cards for better information density on desktop.

### 🛠 Backend Integration
-   **JSON Fields**: Added `amenities_services`, `safety`, `payment_methods`, `staff_languages` to `Sight` model.
-   **Gallery Logic**: `SightSerializer` now computes `gallery_images` (Legacy logic: Main + Banner + Gallery IDs).
-   **Locations API**: New app `locations` providing `/api/locations/countries/` for the Profile dropdown.
-   **Extended User Profile**: Added `passport`, `dtb`, `sex`, `id_citizen` fields to `User` model and serializer.

---

## 4. Verification / Как проверить

### Public Access
1.  Open `http://localhost:5173/`.
2.  Search for "Tashkent" or "Samarkand".
3.  Click "View Details" on any hotel.
4.  Verify the **4-image grid** at the top.

### User/Vendor Flow
1.  **Login**: Use `vendor@mail.ru` / `password123` (or register).
2.  **Profile**: Go to User Menu -> Profile.
3.  **Edit Info**: Fill in Nationality (Country Dropdown), Passport, DOB. Click Save.
4.  **Gallery**: Drag & Drop images to the gallery below.
5.  **Vendor**: Go to User Menu -> Vendor Dashboard.

---

## 5. Deployment Plan / Деплой

### Option A: VPS (Ubuntu + Nginx + Gunicorn)
1.  **Build Frontend**: `cd silkroad-frontend && npm run build`. Copy `dist/` to `/var/www/html`.
2.  **Gunicorn**: Run Django with `gunicorn silkroad_backend.wsgi:application`.
3.  **Nginx**: Proxy `/api` to Gunicorn (port 8000), serve static files from `dist/`.

### Option B: Render / Railway (PaaS)
1.  **Frontend**: Deploy `silkroad-frontend` as a Static Site.
2.  **Backend**: Deploy root as a Python Service. Set `Allowed_HOSTS`.
3.  **Env Vars**: Set `DATABASE_URL`, `SECRET_KEY`, `DEBUG=False`.

---

## Status
**Mission Complete**. The legacy Laravel functionality has been fully ported to the modern Django/React stack.
