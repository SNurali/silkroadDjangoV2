import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotel, getCookie, createBooking } from '../services/api';
import { MapPin, Star, Share2, Heart, CheckCircle, Shield, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/i18n';
import BookingForm from '../components/booking/BookingForm';

const HotelDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
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
            } catch (error) {
                console.error("Failed to fetch hotel", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    const handleBookingClick = (e) => {
        e.preventDefault();
        const token = getCookie('access_token') || localStorage.getItem('accessToken');
        if (!token) {
            alert(t('auth.login_required') || 'Please login first');
            navigate('/login');
            return;
        }
        setIsBookingOpen(true);
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
                <div className="lg:col-span-2 space-y-8">
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
                            {/* Date inputs removed as per request to avoid double entry */}

                            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg transform active:scale-95">
                                {t('hotel_detail.book_now') || 'Reserve Now'}
                            </button>
                            <p className="text-xs text-center text-gray-400">
                                You won't be charged yet.
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
