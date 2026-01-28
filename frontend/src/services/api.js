import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy handles domain
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        console.log("API Request Interceptor:");
        console.log("URL:", config.url);
        console.log("Token raw:", token);
        console.log("Token type:", typeof token);
        if (token) console.log("Token length:", token.length);

        if (token && token !== 'undefined' && token !== 'null') {
            const authHeader = `Bearer ${token}`;
            console.log("Setting Authorization Header:", authHeader);
            config.headers.Authorization = authHeader;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 503) {
            window.location.href = '/maintenance';
            return new Promise(() => { });
        }
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // Retry the request without token (guest mode)
            // Retry the request without token (guest mode)
            const newConfig = { ...originalRequest };
            // Ensure headers is a plain object to avoid axios internal behavior with AxiosHeaders
            newConfig.headers = JSON.parse(JSON.stringify(originalRequest.headers || {}));
            delete newConfig.headers['Authorization'];
            delete newConfig.headers['authorization'];
            return api(newConfig);
        }
        return Promise.reject(error);
    }
);

// Hotels / Sights
export const getSights = async (params = {}) => {
    // Legacy support or alias
    const response = await api.get('/hotels/', { params });
    if (response.data.results) return response.data.results;
    return response.data;
};

export const getHotels = async (params = {}) => {
    const response = await api.get('/hotels/', { params });
    // DRF Pagination returns {count: N, next: url, previous: url, results: []}
    if (response.data.results) return response.data.results;
    return response.data;
};

export const getSight = async (id) => {
    // Alias to getHotel
    return getHotel(id);
};

export const getHotel = async (id) => {
    const response = await api.get(`/hotels/${id}/`);
    return response.data;
};


// Flights
export const searchFlights = async (params = {}) => {
    const response = await api.get('/flights/search/', { params });
    return response.data;
};

export const getAirports = async (query = '') => {
    const response = await api.get('/flights/airports/', { params: { q: query } });
    return response.data;
};

// Bookings
export const createBooking = async (data) => {
    const response = await api.post('/flights/bookings/', data);
    return response.data;
};

// Hotel Bookings (New)
export const createHotelBooking = async (data) => {
    const response = await api.post('/hotels/bookings/', data);
    return response.data;
};

// E-Mehmon Person Info
export const checkPersonInfo = async (data) => {
    // data: { passport, birthday, citizen }
    // data: { passport, birthday, citizen }
    const response = await api.post('/hotels/emehmon/check/', data);
    return response.data;
};

// Payment (Yagona)
export const registerPayment = async (data) => {
    // data: { card_number, exp_month, exp_year, phone }
    const response = await api.post('/hotels/payment/register/', data);
    return response.data;
};

export const confirmPayment = async (data) => {
    // data: { card_token, card_code, ticket_id }
    const response = await api.post('/hotels/payment/confirm/', data);
    return response.data;
};

// Vendor
export const registerVendor = async (data) => {
    // data: FormData (for file upload)
    const response = await api.post('/vendors/register/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getVendorStats = async () => {
    const response = await api.get('/vendors/me/dashboard-stats/');
    return response.data;
};

// Locations
export const getCountries = async () => {
    try {
        const response = await api.get('/locations/countries/');
        return response.data;
    } catch (e) {
        console.error("Failed to fetch countries, using fallback:", e);
        return [
            { id: 173, name: 'Uzbekistan' },
            { id: 1, name: 'USA' },
            { id: 7, name: 'Russia' }
        ];
    }
};

export const getRegions = async () => {
    const response = await api.get('/locations/regions/');
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/hotels/api/categories/');
    return response.data;
};

// Auth
export const login = async (credentials) => {
    // POST /accounts/login/ {email, password}
    const response = await api.post('/accounts/login/', credentials);
    return response.data; // Should contain {access, refresh}
};

export const googleLogin = async (token) => {
    const response = await api.post('/accounts/auth/google/', { token });
    return response.data;
};

// User Profile / Gallery
export const getProfileImages = async () => {
    const response = await api.get('/users/me/images/');
    return response.data;
};

export const uploadImage = async (formData) => {
    const response = await api.post('/users/me/images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteImage = async (id) => {
    await api.delete(`/users/me/images/${id}/`);
};

export const reorderImages = async (order) => {
    // order = [id1, id2, id3...]
    await api.post('/users/me/images/reorder/', { order });
};

// Utils
export const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

export const getProfile = async () => {
    const response = await api.get('/accounts/profile/');
    return response.data;
};

export const updateProfile = async (data) => {
    // If data has file, use multipart/form-data
    const hasFile = data instanceof FormData;
    const config = hasFile ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    // Use PATCH for partial updates (e.g. just photo, or just phone)
    const response = await api.patch('/accounts/profile/', data, config);
    return response.data;
};

export const changePassword = async (data) => {
    const response = await api.post('/accounts/profile/password/', data);
    return response.data;
};

export const syncEmehmonData = async () => {
    const response = await api.post('/accounts/profile/sync-emehmon/');
    return response.data;
};

// Notifications
export const getNotifications = async () => {
    const response = await api.get('/notifications/');
    if (response.data.results) return response.data.results;
    return response.data;
};

export const markNotificationRead = async (id) => {
    const response = await api.patch(`/notifications/${id}/mark_as_read/`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.post('/notifications/mark_all_as_read/');
    return response.data;
};

// Chatbot
export const getConversations = async () => {
    const response = await api.get('/chat/conversations/');
    return response.data;
};

export const sendChatMessage = async (data) => {
    // data: { text, conversation_id? } or FormData
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/chat/send/', data, config);
    return response.data;
};

export default api;
