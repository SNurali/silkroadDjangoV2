import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getHotel, getCookie, createBooking } from '../services/api';
import { MapPin, Star, Share2, Heart, CheckCircle, Shield, X, ZoomIn, MessageSquare, ThumbsUp, User, Info, Calendar, Users, Coffee, Waves, Car, Bluetooth as Tooth } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/i18n';
import BookingForm from '../components/booking/BookingForm';
import api from '../services/api';
import toast from 'react-hot-toast';
import CompactSearchBar from '../components/ui/SearchBar';
import { format, parseISO, isValid } from 'date-fns';
import { ru, uz, enUS } from 'date-fns/locale';

const HotelDetail = () => {

    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [searchingRooms, setSearchingRooms] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState({}); // {roomTypeId: quantity}

    // Initialize filters from URL
    const [filters, setFilters] = useState({
        startDate: searchParams.get('check_in') ? parseISO(searchParams.get('check_in')) : null,
        endDate: searchParams.get('check_out') ? parseISO(searchParams.get('check_out')) : null,
        adults: parseInt(searchParams.get('adults') || '2'),
        children: parseInt(searchParams.get('children') || '0'),
        rooms: parseInt(searchParams.get('rooms') || '1'),
    });

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '', captcha_key: '', captcha_value: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [captchaImage, setCaptchaImage] = useState(null);

    const user = JSON.parse(localStorage.getItem('user')); // Simple mock user logic or from context
    const lang = getCookie('django_language');

    // Booking State
    const [bookingData, setBookingData] = useState({
        check_in: '',
        check_out: '',
        adults: 1,
        children: 0,
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_requests: '',
        selected_rooms_json: {} // {roomTypeID: count}
    });

    useEffect(() => {
        const fetchHotel = async () => {
            setLoading(true);
            try {
                const data = await getHotel(id);
                setHotel(data);
                // Fetch reviews after hotel loads
                fetchReviews();
                fetchReviewStats();

                // If we have dates, search rooms immediately
                if (filters.startDate && filters.endDate) {
                    searchRooms(filters);
                }
            } catch (error) {
                console.error("Failed to fetch hotel", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    const searchRooms = async (searchData) => {
        setSearchingRooms(true);
        try {
            const response = await api.post(`/hotels/${id}/search-rooms/`, {
                check_in: format(searchData.startDate, 'yyyy-MM-dd'),
                check_out: format(searchData.endDate, 'yyyy-MM-dd'),
                adults: searchData.adults,
                children: searchData.children,
                rooms: searchData.rooms
            });

            if (response.data.success) {
                setAvailableRooms(response.data.rooms);
                // Pre-select rooms if requested?
                // For now just keep it simple
            }
        } catch (error) {
            console.error('Room search failed:', error);
            toast.error('Failed to search available rooms');
        } finally {
            setSearchingRooms(false);
        }
    };

    const handleRoomQuantityChange = (roomTypeId, quantity) => {
        setSelectedRooms(prev => {
            const updated = { ...prev };
            if (quantity > 0) {
                updated[roomTypeId] = quantity;
            } else {
                delete updated[roomTypeId];
            }
            return updated;
        });
    };

    const calculateTotalSelectedPrice = () => {
        let total = 0;
        Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
            const room = availableRooms.find(r => r.room_type_id === parseInt(roomTypeId));
            if (room) {
                total += room.total_price_usd * quantity;
            }
        });
        return total;
    };

    const handleBookingClick = (e) => {
        if (e) e.preventDefault();
        const token = getCookie('access_token') || localStorage.getItem('accessToken');
        if (!token) {
            toast.error(t('auth.login_required') || 'Please login first');
            navigate('/login');
            return;
        }
        setIsBookingOpen(true);
    };

    // Fetch Reviews
    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            const response = await api.get(`/hotels/${id}/comments/`);
            // Handle both paginated and non-paginated responses
            const data = response.data.results || response.data;
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    // Fetch Review Statistics
    const fetchReviewStats = async () => {
        try {
            const response = await api.get(`/hotels/${id}/comments/stats/`);
            setReviewStats(response.data);
        } catch (error) {
            console.error('Failed to fetch review stats:', error);
        }
    };

    // Fetch CAPTCHA
    const fetchCaptcha = async () => {
        try {
            const response = await api.get('/hotels/captcha/generate/');
            setCaptchaImage(response.data);
            setReviewData(prev => ({ ...prev, captcha_key: response.data.captcha_key, captcha_value: '' }));
        } catch (error) {
            console.error('Failed to fetch captcha:', error);
        }
    };

    // Handle showing review form
    const handleShowReviewForm = () => {
        setShowReviewForm(true);
        fetchCaptcha(); // Load captcha when form opens
    };

    // Submit Review
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        const token = getCookie('access_token') || localStorage.getItem('accessToken');
        if (!token) {
            toast.error('Please login to submit a review');
            navigate('/login');
            return;
        }

        if (reviewData.comment.length < 10) {
            toast.error('Review must be at least 10 characters');
            return;
        }

        if (!reviewData.captcha_value) {
            toast.error('Please complete the CAPTCHA');
            return;
        }

        setSubmittingReview(true);
        try {
            await api.post(`/hotels/${id}/comments/`, {
                rating: reviewData.rating,
                comment: reviewData.comment,
                captcha: `${reviewData.captcha_key}:${reviewData.captcha_value}`
            });

            toast.success('Review submitted! It will appear after moderation.');
            setShowReviewForm(false);
            setReviewData({ rating: 5, comment: '', captcha_key: '', captcha_value: '' });
            setCaptchaImage(null);

            // Refresh reviews
            fetchReviews();
            fetchReviewStats();
        } catch (error) {
            console.error('Failed to submit review:', error);
            const errorMsg = error.response?.data?.captcha?.[0] || error.response?.data?.error || 'Failed to submit review';
            toast.error(errorMsg);
            // Refresh captcha on error
            fetchCaptcha();
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!hotel) return <div className="text-center py-20">Hotel not found.</div>;

    const images = (hotel.images && hotel.images.length > 0) ? hotel.images :
        (hotel.gallery_images && hotel.gallery_images.length > 0) ? hotel.gallery_images :
            ['/media/images/default-hotel.jpg'];

    // Fallback amenities parser
    const parseList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try {
            if (typeof data === 'object') return Object.keys(data).filter(k => data[k]);
            return JSON.parse(data);
        } catch { return []; }
    };

    const amenities = parseList(hotel.amenities_services);
    const safety = parseList(hotel.safety);

    // Robust geolocation parsing
    let lat = null, lng = null;
    if (hotel.geolocation && typeof hotel.geolocation === 'string' && hotel.geolocation.includes(',')) {
        const parts = hotel.geolocation.split(',').map(s => s.trim());
        if (parts.length >= 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
            lat = parts[0];
            lng = parts[1];
        }
    }

    // Debugging (remove in production)
    // console.log("Geo:", hotel.geolocation, "Parsed:", lat, lng, "ShowMap:", showMap);

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen pb-12 transition-colors duration-200">
            {/* Title Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getLocalized(hotel, 'name', lang)}</h1>
                        <div className="flex flex-wrap items-center mt-3 gap-2 text-sm">
                            <div className="flex items-center text-gray-500 dark:text-slate-400">
                                <MapPin size={16} className="mr-1" />
                                <span>{hotel.address}</span>
                            </div>
                            {lat && lng ? (
                                <button onClick={() => setShowMap(true)} className="flex items-center px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800 transition-colors">
                                    <MapPin size={14} className="mr-1.5" />
                                    {t('filters.view_on_map', 'View on Map')}
                                </button>
                            ) : (
                                <span className="flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 font-medium border border-gray-200 dark:border-slate-700 cursor-not-allowed">
                                    <MapPin size={14} className="mr-1.5" />
                                    {t('filters.map_unavailable', 'Map Unavailable')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 border dark:border-slate-700 dark:text-slate-300"><Heart size={20} /></button>
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 border dark:border-slate-700 dark:text-slate-300"><Share2 size={20} /></button>
                    </div>
                </div>

                {/* Refined Search Bar */}
                <div className="mt-8 bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-800">
                    <CompactSearchBar
                        onSearch={(data) => {
                            setFilters(data);
                            searchRooms(data);
                            // Update URL params
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set('check_in', format(data.startDate, 'yyyy-MM-dd'));
                            newParams.set('check_out', format(data.endDate, 'yyyy-MM-dd'));
                            newParams.set('adults', data.adults);
                            newParams.set('children', data.children);
                            newParams.set('rooms', data.rooms);
                            setSearchParams(newParams);
                        }}
                        initialData={{
                            ...filters,
                            location: hotel.name // Placeholder
                        }}
                        isCompact={true}
                    />
                </div>
            </div>

            {/* Gallery */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                {images.length === 1 ? (
                    <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden shadow-md relative group cursor-pointer" onClick={() => setLightboxImage(images[0])}>
                        <img src={images[0]} alt="Main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-96">
                        <div className="rounded-xl overflow-hidden shadow-sm relative group h-full cursor-pointer" onClick={() => setLightboxImage(images[0])}>
                            <img src={images[0]} alt="Main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-full">
                            {images.slice(1, 5).map((img, idx) => (
                                <div key={idx} className="h-44 rounded-xl overflow-hidden shadow-sm relative group cursor-pointer" onClick={() => setLightboxImage(img)}>
                                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content & Booking Form */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    {/* Availability & Rooms Section */}
                    <section id="rooms" className="scroll-mt-32">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-indigo-600" />
                                {t('hotel_detail.availability', 'Availability & Rooms')}
                            </h2>
                            {searchingRooms && (
                                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                                    <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                    Updating...
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {availableRooms.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Info className="mx-auto text-slate-400 mb-4" size={48} />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No rooms found for selected dates</h3>
                                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">Try adjusting your dates or guest count in the search bar above to see available options.</p>
                                </div>
                            ) : (
                                availableRooms.map(room => (
                                    <div key={room.room_type_id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Room Image */}
                                            <div className="md:w-1/3 h-48 md:h-auto relative">
                                                <img
                                                    src={room.images?.[0] || '/media/images/default-room.jpg'}
                                                    alt={room.room_type}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                                                    {room.available_count} left
                                                </div>
                                            </div>

                                            {/* Room Details */}
                                            <div className="md:w-2/3 p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{getLocalized(room, 'room_type', lang)}</h3>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-indigo-600">${room.price_per_night_usd}</div>
                                                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Per Night</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-1.5"><Users size={16} /> {room.capacity} Guests</div>
                                                        {room.features.wifi && <div className="flex items-center gap-1.5"><Coffee size={16} /> Free WiFi</div>}
                                                        {room.features.aircond && <div className="flex items-center gap-1.5"><Waves size={16} /> AC</div>}
                                                        {room.features.tvset && <div className="flex items-center gap-1.5"><Car size={16} /> TV</div>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                                    <div className="text-indigo-600 font-bold">
                                                        Total: ${room.total_price_usd * (selectedRooms[room.room_type_id] || 0)}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRoomQuantityChange(room.room_type_id, (selectedRooms[room.room_type_id] || 0) - 1)}
                                                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-30"
                                                            disabled={!selectedRooms[room.room_type_id]}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="text-lg font-bold w-4 text-center">{selectedRooms[room.room_type_id] || 0}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRoomQuantityChange(room.room_type_id, (selectedRooms[room.room_type_id] || 0) + 1)}
                                                            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-30"
                                                            disabled={(selectedRooms[room.room_type_id] || 0) >= room.available_count}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('hotel_detail.about')}</h2>
                        <div className="text-gray-600 dark:text-slate-300 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: getLocalized(hotel, 'description', lang) }} />
                    </section>
                    {amenities.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('hotel_detail.amenities')}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {amenities.map((item, idx) => (
                                    <div key={idx} className="flex items-center text-gray-700 dark:text-slate-300">
                                        <CheckCircle size={18} className="text-green-500 mr-2" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Reviews Section */}
                    <section className="mt-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="text-indigo-600" />
                                Guest Reviews
                            </h2>
                            <button
                                onClick={handleShowReviewForm}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Star size={16} />
                                Write a Review
                            </button>
                        </div>

                        {/* Rating Statistics */}
                        {reviewStats && reviewStats.total_reviews > 0 && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6 border border-indigo-100 dark:border-indigo-900">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <span className="text-5xl font-bold text-indigo-600">{reviewStats.avg_rating}</span>
                                            <div>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={20} className={star <= Math.round(reviewStats.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{reviewStats.total_reviews} reviews</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map(rating => (
                                            <div key={rating} className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-12">{rating} star</span>
                                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-yellow-400 h-full transition-all duration-500"
                                                        style={{ width: `${reviewStats.rating_percentages[rating] || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">{reviewStats.rating_distribution[rating] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Review Form */}
                        <AnimatePresence>
                            {showReviewForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 overflow-hidden"
                                >
                                    <form onSubmit={handleSubmitReview} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Write Your Review</h3>

                                        {/* Star Rating */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rating</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                                        className="transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            size={32}
                                                            className={star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Review (min. 10 characters)</label>
                                            <textarea
                                                value={reviewData.comment}
                                                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                                rows="4"
                                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white resize-none"
                                                placeholder="Share your experience staying at this hotel..."
                                                required
                                                minLength={10}
                                                maxLength={1000}
                                            />
                                            <p className="text-xs text-slate-500 mt-1">{reviewData.comment.length}/1000 characters</p>
                                        </div>

                                        {/* CAPTCHA */}
                                        {captchaImage && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Security Check</label>
                                                <div className="flex items-center gap-3">
                                                    <div className="border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white">
                                                        <img
                                                            src={captchaImage.captcha_image_url}
                                                            alt="CAPTCHA"
                                                            className="h-12"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={fetchCaptcha}
                                                        className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                        title="Refresh CAPTCHA"
                                                    >
                                                        🔄 Refresh
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={reviewData.captcha_value}
                                                    onChange={(e) => setReviewData(prev => ({ ...prev, captcha_value: e.target.value }))}
                                                    className="w-full mt-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                                                    placeholder="Enter the text/numbers shown above"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={submittingReview || reviewData.comment.length < 10}
                                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowReviewForm(false);
                                                    setReviewData({ rating: 5, comment: '', captcha_key: '', captcha_value: '' });
                                                    setCaptchaImage(null);
                                                }}
                                                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reviews List */}
                        <div className="space-y-4">
                            {loadingReviews ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <MessageSquare size={48} className="mx-auto text-slate-400 mb-3" />
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">No reviews yet</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Be the first to share your experience!</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                    <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{review.user_name}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} size={16} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Booking Form Side */}
                <aside className="sticky top-28 h-fit space-y-6">
                    {/* Map Preview (Visible near top) */}
                    {lat && lng && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border dark:border-slate-700 overflow-hidden">
                            <div className="h-48 relative group cursor-pointer" onClick={() => setShowMap(true)}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ pointerEvents: 'none' }} // Disable interaction effectively making it a static image/preview
                                    src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    title="Location Preview"
                                ></iframe>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <button className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        {t('map.expand') || 'Expand Map'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t dark:border-slate-700">
                                <div className="flex items-start text-sm text-gray-600 dark:text-slate-400">
                                    <MapPin size={16} className="mr-2 mt-0.5 shrink-0" />
                                    <span>{hotel.address}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border dark:border-slate-700 p-6">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-gray-500 dark:text-slate-400">{t('hotel_detail.start_from')}</span>
                                <div className="flex items-baseline">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${hotel.is_foreg || hotel.price || 0}</span>
                                    <span className="text-gray-500 dark:text-slate-400 ml-1">/ night</span>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleBookingClick} className="space-y-4">
                            {Object.keys(selectedRooms).length > 0 && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-pulse-subtle">
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Total Stay</div>
                                    <div className="text-2xl font-bold text-indigo-600">${calculateTotalSelectedPrice().toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {Object.values(selectedRooms).reduce((a, b) => a + b, 0)} rooms selected
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={Object.keys(selectedRooms).length === 0}
                                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {Object.keys(selectedRooms).length > 0 ? (t('hotel_detail.book_now') || 'Reserve Selected Rooms') : 'Select Rooms to Continue'}
                            </button>
                            <p className="text-xs text-center text-gray-400">
                                {Object.keys(selectedRooms).length > 0 ? 'You won\'t be charged yet.' : 'Please select at least one room type.'}
                            </p>
                        </form>
                    </div>
                </aside>
            </div>

            <BookingForm
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                hotel={hotel}
                user={user}
                preSelectedRooms={selectedRooms}
                initialSearchParams={{
                    ...filters,
                    check_in: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : '',
                    check_out: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : '',
                }}
            />
            {/* Map Modal */}
            <AnimatePresence>
                {showMap && lat && lng && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMap(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('map.location') || 'Location'}</h3>
                                <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="h-[500px] bg-gray-100">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    title="Hotel Location"
                                ></iframe>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxImage && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                        <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
                            <X size={32} />
                        </button>
                        <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain" />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HotelDetail;
