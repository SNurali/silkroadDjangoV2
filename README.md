# SilkRoad Project

![SilkRoad Logo](./silkroad-frontend/public/silkroad-logo-final.png)

SilkRoad is a comprehensive Tourism & Hotel Booking platform connecting travelers with authentic experiences in Central Asia. It features a robust multi-role system (Travelers, Vendors, Admins) and integrates hotel bookings, tour packages, and transport services.

## 🚀 Features

### For Travelers
*   **Smart Search**: Find hotels and tours by location, dates, and guest count.
*   **Booking System**: Real-time checking of room availability and price calculation.
*   **Personal Profile**: Manage bookings, tickets, and personal information.
*   **Secure Payments**: Integrated payment processing logic (Yagona Billing ready).
*   **Responsive Design**: Modern UI/UX with Dark Mode support.

### For Vendors (Hotel/Tour Operators)
*   **Vendor Dashboard**: Comprehensive analytics on revenue, bookings, and customer stats.
*   **Management Portal**: Create and manage Hotels, Rooms, Tours (Sights), and Ticket types.
*   **Booking Control**: Approve or Reject booking requests with specific rejection reasons.
*   **Financial Reports**: Track daily income and booking trends via interactive charts.

### Technical Highlights
*   **Modern Stack**: Django 5 (Backend) + React/Vite (Frontend).
*   **JWT Authentication**: Secure stateless authentication implementation.
*   **Drag-and-Drop Gallery**: Interactive image management for vendors.
*   **Multi-language Support**: i18n ready structure (EN, RU, UZ).

---

## 🛠 Technology Stack

### Backend
*   **Python 3.12**
*   **Django 5.0** & **Django REST Framework**
*   **SimpleJWT** (Authentication)
*   **SQLite** (Development) / PostgreSQL (Production ready)

### Frontend
*   **React 18**
*   **Vite** (Build tool)
*   **TailwindCSS** (Styling)
*   **Axios** (API Client)
*   **Recharts** (Analytics)
*   **Lucide React** (Icons)

---

## ⚙️ Installation & Setup

### Prerequisites
*   Python 3.12+
*   Node.js 18+ and npm

### 1. Backend Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/SNurali/silkroadDjangoV2.git
    cd silkroadDjangoV2
    ```

2.  **Create and activate virtual environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Apply Migrations**:
    ```bash
    python manage.py migrate
    ```

5.  **Create Superuser (Admin)**:
    ```bash
    python manage.py createsuperuser
    ```

6.  **Run Server**:
    ```bash
    python manage.py runserver
    ```
    Backend will be available at `http://localhost:8000`.

### 2. Frontend Setup

1.  **Navigate to frontend directory**:
    ```bash
    cd silkroad-frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Frontend will be available at `http://localhost:5173`.

---

## 🔑 Environment Configuration

### Backend (`.env`)
Create a `.env` file in the root directory (next to `manage.py`):
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
# Database config (Optional for dev, uses SQLite by default)
```

### Frontend (`.env`)
Create a `.env` file in `silkroad-frontend/`:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 📚 API Documentation

The backend provides several key API endpoints:

*   **Auth**:
    *   `POST /api/accounts/login/` - Obtain Access/Refresh Tokens
    *   `POST /api/accounts/register/` - User Registration
*   **Hotels**:
    *   `GET /api/all-hotels/` - List all hotels (public)
    *   `GET /api/hotels/<id>/` - Hotel details
    *   `POST /api/hotels/bookings/` - Create a booking
*   **Vendor**:
    *   `GET /api/vendors/dashboard/` - Stats and Charts
    *   `POST /api/vendors/bookings/<id>/approve/` - Confirm booking
    *   `POST /api/vendors/bookings/<id>/reject/` - Reject booking (requires reason)

---

## 🤝 Contribution

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
