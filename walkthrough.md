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

### 5. Quick Actions & Human Handoff
- **Quick Action Buttons**: Added localized buttons ("Find Hotel", "Find Tour", "Human Support") above the input area for easy navigation logic.
- **Human Support**: 
    - Users can request a human agent.
    - The system sends a Telegram notification with a **direct link to the chat**.
    - **Admin Interface**: Admins can click the link (e.g., `http://localhost:3000/support-chat/123`) to view history and reply as "Support".
    - **Smart Bot Silencing**: Once a human agent joins the chat, the bot will stop auto-replying to prevent interruptions.
    - **Real-time Updates**: The user widget polls for new messages every 4-5 seconds, so agent replies appear automatically.
    - **Persistence**: The conversation ID is stored in `localStorage`, so the chat history stays even after refreshing the page.
    - To enable this, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to `.env`.

### 6. Open WebUI Integration (2026 AI Standard)
- **Upgraded Brain**: The chatbot now uses **Open WebUI** (local LLM/Ollama compatible) as its primary decision-maker.
- **2026 Embed Widget**: Added support for the official Open WebUI floating script.
- **Toggle System**: You can switch between the "Branded SilkRoad Widget" and the "Official Open WebUI Widget" by changing a single flag (`USE_OPEN_WEBUI_EMBED`) in `App.jsx`.
- **Backend Fallback**: If Open WebUI is not reachable, the system automatically falls back to **Google Gemini**.

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
