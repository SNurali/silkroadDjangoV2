import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getHotels } from '../services/api';
import { MapPin, Star, Calendar, Users, SlidersHorizontal, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLocalized, getCookie } from '../utils/i18n';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from "date-fns";
import { ru, uz, enUS } from 'date-fns/locale';
import CompactSearchBar from '../components/ui/SearchBar';

const HotelList = () => {
    const { t } = useTranslation();
    const lang = getCookie('django_language');
    const [searchParams] = useSearchParams();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priceRange, setPriceRange] = useState(5000); // Default max
    const [selectedStars, setSelectedStars] = useState([]);
    const [filters, setFilters] = useState({
        location: searchParams.get('location') || '',
        startDate: searchParams.get('check_in') ? parseISO(searchParams.get('check_in')) : null,
        endDate: searchParams.get('check_out') ? parseISO(searchParams.get('check_out')) : null,
        adults: searchParams.get('adults') || '2',
        children: searchParams.get('children') || '0',
        rooms: searchParams.get('rooms') || '1',
    });

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const apiParams = {
                ...filters,
                check_in: filters.startDate && isValid(filters.startDate) ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
                check_out: filters.endDate && isValid(filters.endDate) ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
                price_max: priceRange,
            };
            delete apiParams.startDate;
            delete apiParams.endDate;

            if (selectedStars.length > 0) {
                // If backend supports list, otherwise we might need multiple params or custom logic
                apiParams.stars = selectedStars.join(',');
            }

            const data = await getHotels(apiParams);
            setHotels(data);
        } catch (error) {
            console.error("Failed to fetch hotels", error);
            // Fallback Mock Data if API fails/unauthorized 
            setHotels([
                { id: 1, name: 'Courtyard by Marriott New York', location: 'New York, USA', price: 750, rating: 4.5, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
                { id: 2, name: 'Park Plaza Lodge Hotel', location: 'London, UK', price: 950, rating: 4.8, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
                { id: 3, name: 'Royal Garden Hotel', location: 'Manhattan, New York', price: 1200, rating: 4.7, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
                { id: 4, name: 'Grand Hyatt', location: 'Dubai, UAE', price: 2500, rating: 5.0, image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    const parseList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try {
            if (typeof data === 'object') return Object.keys(data).filter(k => data[k]);
            return JSON.parse(data);
        } catch (e) { return []; }
    };

    const HotelCard = ({ hotel }) => {
        let images = [];
        if (Array.isArray(hotel.images)) {
            images = hotel.images;
        } else if (typeof hotel.images === 'string') {
            images = hotel.images.split(',');
        } else if (hotel.gallery_images && hotel.gallery_images.length > 0) {
            images = hotel.gallery_images;
        } else {
            images = ['/media/images/default-hotel.jpg'];
        }

        const amenities = parseList(hotel.amenities_services).slice(0, 5); // Show first 5

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full mb-6 border border-slate-100 dark:border-slate-700"
            >
                <div className="relative h-48 sm:h-56 w-full flex-shrink-0">
                    <img
                        src={images[0]}
                        alt={getLocalized(hotel, 'name', lang)}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{hotel.rating || '4.5'}</span>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {getLocalized(hotel, 'name', lang)}
                            </h3>
                        </div>

                        <div className="flex items-center text-gray-500 dark:text-slate-400 mb-3 text-sm">
                            <MapPin size={16} className="mr-1" />
                            <span className="truncate">{getLocalized(hotel, 'address', lang) || hotel.location || 'Samarkand'}</span>
                        </div>

                        {/* Amenities Preview */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {amenities.map((idx) => (
                                <span key={idx} className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-md capitalize">{idx}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                        <div>
                            <div className="text-xs text-gray-400 dark:text-slate-500">{t('hotel_list.start_from')}</div>
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">${hotel.is_foreg || hotel.price || '0'}</span>
                            <span className="text-gray-500 dark:text-slate-400 text-sm"> {t('hotel_detail.per_night')}</span>
                        </div>
                        <Link
                            to={`/hotels/${hotel.id}?${searchParams.toString()}`}
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            {t('hotel_list.view_details')}
                        </Link>
                    </div>
                </div>
            </motion.div>
        )
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            {/* Filter Section (Hero Simplified) */}
            <div className="bg-indigo-900 dark:bg-indigo-950 text-white pt-24 pb-20 px-4 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">{t('hotel_list.title', { count: hotels.length })}</h1>

                    {/* Compact Search Bar */}
                    <div className="max-w-6xl mx-auto -mb-20 relative z-50">
                        <CompactSearchBar
                            onSearch={(data) => {
                                setFilters({
                                    location: data.location,
                                    startDate: data.startDate,
                                    endDate: data.endDate,
                                    adults: data.adults,
                                    children: data.children,
                                    rooms: data.rooms,
                                });
                                // fetchHotels will be triggered by filter changes if we add it to useEffect or call it manually
                                fetchHotels(); // Manually call it
                            }}
                            initialData={{
                                location: filters.location,
                                startDate: filters.startDate,
                                endDate: filters.endDate,
                                adults: parseInt(filters.adults),
                                children: parseInt(filters.children),
                                rooms: parseInt(filters.rooms),
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar */}
                    <div className="hidden lg:block w-1/4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 sticky top-24 transition-colors border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('filters.title')}</h3>
                                <button
                                    onClick={() => {
                                        setPriceRange(5000);
                                        setSelectedStars([]);
                                        fetchHotels();
                                    }}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                    {t('filters.clear_all')}
                                </button>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">{t('filters.price_range')}</h4>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    step="100"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                                />
                                <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mt-2">
                                    <span>$0</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">${priceRange}</span>
                                    <span>$5000</span>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">{t('filters.star_rating')}</h4>
                                {[5, 4, 3, 2, 1].map(stars => (
                                    <div key={stars} className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id={`star-${stars}`}
                                            checked={selectedStars.includes(stars)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStars([...selectedStars, stars]);
                                                } else {
                                                    setSelectedStars(selectedStars.filter(s => s !== stars));
                                                }
                                            }}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                                        />
                                        <label htmlFor={`star-${stars}`} className="ml-2 flex items-center text-gray-700 dark:text-slate-300 cursor-pointer">
                                            {Array(stars).fill(0).map((_, i) => (
                                                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={fetchHotels}
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
                            >
                                {t('filters.apply')}
                            </button>
                        </div>
                    </div>

                    {/* Hotel Grid */}
                    <div className="w-full lg:w-3/4">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white dark:bg-slate-800 h-96 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {hotels.map(hotel => (
                                    <HotelCard key={hotel.id} hotel={hotel} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelList;
