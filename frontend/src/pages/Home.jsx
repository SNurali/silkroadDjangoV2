import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Plane, Navigation, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLocalized, getCookie } from '../utils/i18n';
import { useTranslation, Trans } from 'react-i18next';
import { clsx } from 'clsx';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ru, uz, enUS } from 'date-fns/locale';
import CompactSearchBar from '../components/ui/SearchBar';

export default function Home() {
    const { t } = useTranslation();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('hotels');

    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(1);

    const lang = getCookie('django_language');
    const navigate = useNavigate();

    // Selection Logic

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                // Fetch from backend (Hotels)
                const res = await api.get('/hotels/');
                if (res.data && res.data.results) {
                    setHotels(res.data.results);
                } else {
                    setHotels(res.data);
                }
            } catch (err) {
                console.warn("Failed to fetch hotels, using mock data", err);
                console.error(`Failed to load hotels: ${err.message || 'Unknown error'}`);
                // Still use mock data for fallback, but show error too
                setHotels([
                    { id: 1, name: "Hotel Tashkent Palace", rating: 4.8, price: "1,200,000", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800", location: "Tashkent" },
                    { id: 2, name: "Silk Road Samarkand", rating: 4.9, price: "2,500,000", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800", location: "Samarkand" },
                    { id: 3, name: "Bukhara Desert Oasis", rating: 4.5, price: "900,000", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800", location: "Bukhara" },
                    { id: 4, name: "Khiva Old City Stars", rating: 4.7, price: "1,100,000", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800", location: "Khiva" },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Hero Section */}
            <section className="relative min-h-[700px] flex items-center justify-center pt-28">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero.png"
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/60 via-transparent to-slate-50 dark:to-slate-900"></div>
                </div>

                <div className="relative z-10 w-full max-w-5xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-sm">
                            <Trans i18nKey="home.hero_title">
                                Find the top <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Hotels nearby</span>
                            </Trans>
                        </h1>
                        <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                            {t('home.hero_subtitle')}
                        </p>
                    </motion.div>

                    {/* Search Tabs */}
                    <div className="flex gap-2 mb-2 ml-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'hotels', label: t('home.tab_hotels'), icon: Star },
                            { id: 'flights', label: t('home.tab_flights'), icon: MapPin },
                            { id: 'tours', label: t('home.tab_tours'), icon: Calendar },
                            { id: 'cabs', label: t('home.tab_cabs'), icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all duration-200 whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-lg"
                                        : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        {activeTab === 'hotels' && (
                            <CompactSearchBar
                                onSearch={(data) => {
                                    const params = new URLSearchParams();
                                    if (data.location) params.append('location', data.location);
                                    if (data.startDate) params.append('check_in', format(data.startDate, 'yyyy-MM-dd'));
                                    if (data.endDate) params.append('check_out', format(data.endDate, 'yyyy-MM-dd'));
                                    params.append('adults', data.adults);
                                    params.append('children', data.children);
                                    params.append('rooms', data.rooms);
                                    navigate(`/hotels?${params.toString()}`);
                                }}
                                initialData={{
                                    locationLabel: t('home.search_location'),
                                    locationPlaceholder: t('home.search_placeholder_location'),
                                    dateLabel: t('home.search_dates'),
                                    datePlaceholder: t('home.search_placeholder_dates'),
                                    guestLabel: t('home.search_guests'),
                                    adults, children, rooms
                                }}
                            />
                        )}

                        {activeTab === 'flights' && (
                            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_from')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <MapPin className="text-indigo-500" size={24} />
                                        <input type="text" placeholder={t('flights.origin_placeholder')} className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_to')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <MapPin className="text-indigo-500" size={24} />
                                        <input type="text" placeholder={t('flights.dest_placeholder')} className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_departure')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <Calendar className="text-indigo-500" size={24} />
                                        <input type="date" className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <button type="button" onClick={() => navigate('/flights')} className="h-[60px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 group">
                                    <Search size={22} />
                                    <span className="text-lg uppercase tracking-tight">{t('home.search_flights_btn')}</span>
                                </button>
                            </form>
                        )}

                        {activeTab === 'tours' && (
                            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_query_placeholder')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <Search className="text-amber-500" size={24} />
                                        <input type="text" placeholder={t('home.search_activity_placeholder')} className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_dates')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <Calendar className="text-amber-500" size={24} />
                                        <input type="date" className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <button type="button" onClick={() => navigate('/tours')} className="h-[60px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 group">
                                    <Search size={22} />
                                    <span className="text-lg uppercase tracking-tight">{t('home.search_tours_btn')}</span>
                                </button>
                            </form>
                        )}

                        {activeTab === 'cabs' && (
                            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_pickup')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <MapPin className="text-emerald-500" size={24} />
                                        <input type="text" placeholder="Airport or Hotel" className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_dropoff')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <MapPin className="text-emerald-500" size={24} />
                                        <input type="text" placeholder="Destination" className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest">{t('home.search_time')}</label>
                                    <div className="flex items-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                        <Calendar className="text-emerald-500" size={24} />
                                        <input type="datetime-local" className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-200 font-semibold" />
                                    </div>
                                </div>
                                <button type="button" onClick={() => navigate('/cabs')} className="h-[60px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 group">
                                    <Search size={22} />
                                    <span className="text-lg uppercase tracking-tight">{t('home.search_cabs_btn')}</span>
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('home.featured_title')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('home.featured_subtitle')}</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl h-80 animate-pulse shadow-sm border border-slate-100 dark:border-slate-700"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {hotels.map((hotel) => (
                            <Link to={`/hotels/${hotel.id}`} key={hotel.id} className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full block">
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={(hotel.images && hotel.images[0]) || '/media/images/default-hotel.jpg'}
                                        alt={getLocalized(hotel, 'name', lang)}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => e.currentTarget.src = '/media/images/default-hotel.jpg'}
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-sm">
                                        <MapPin size={12} className="text-blue-500" />
                                        {hotel.geolocation || hotel.address || 'Uzbekistan'}
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                                            {getLocalized(hotel, 'name', lang)}
                                        </h3>
                                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded text-xs font-bold text-yellow-700 dark:text-yellow-500">
                                            <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                            {hotel.rating}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs text-slate-400 block">{t('home.starting_from')}</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                UZS {Number(hotel.price).toLocaleString()}
                                            </span>
                                        </div>
                                        <button className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
