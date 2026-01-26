import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Star, Filter, ArrowRight, Clock } from 'lucide-react';
import api from '../../services/api';

export default function TourHome() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);

    // Filters state
    const [selectedLocation, setSelectedLocation] = useState(searchParams.get('region') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

    useEffect(() => {
        // Fetch dropdown options
        const fetchOptions = async () => {
            try {
                const [locRes, catRes] = await Promise.all([
                    api.get('/locations/regions/'),
                    api.get('/hotels/categories/')
                ]);
                setLocations(locRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error("Failed to load options", err);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            try {
                // Construct query from searchParams
                const query = searchParams.toString();
                const res = await api.get(`/sights/?${query}`);
                setTours(res.data.results || res.data); // Handle pagination (results) or flat list
            } catch (err) {
                console.error("Failed to load tours", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = {};
        if (selectedLocation) params.region = selectedLocation;
        if (selectedCategory) params.category = selectedCategory;
        setSearchParams(params);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop"
                        alt="Tours Hero"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">{t('tours.hero_title')}</h1>
                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">{t('tours.hero_subtitle')}</p>

                    {/* Filter Bar */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-4xl mx-auto shadow-2xl">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="text-slate-400" size={20} />
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                >
                                    <option value="">{t('tours.location')}</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-5 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter className="text-slate-400" size={20} />
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-white/90 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">{t('tours.category')}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <button type="submit" className="w-full h-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                    <Search size={20} />
                                    <span className="md:hidden">Search</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Tours List */}
            <section className="py-16 container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {t('tours.results_count', { count: tours.length })}
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="spinner-border text-indigo-600 w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400">{t('tours.loading')}</p>
                    </div>
                ) : tours.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tours.map((tour) => (
                            <div key={tour.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group">
                                <Link to={`/tours/${tour.id}`} className="block relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={tour.image ? (tour.image.startsWith('http') ? tour.image : `http://127.0.0.1:8000${tour.image}`) : "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600"}
                                        alt={tour.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1">
                                        <MapPin size={12} className="text-indigo-600" />
                                        {tour.region_name || "Uzbekistan"}
                                    </div>
                                    {tour.category && (
                                        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white">
                                            {tour.category.name}
                                        </div>
                                    )}
                                </Link>

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            <Link to={`/tours/${tour.id}`}>{tour.name}</Link>
                                        </h3>
                                        {tour.rating > 0 && (
                                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{tour.rating}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                                        {tour.sh_description || tour.description || "Explore this amazing destination with SilkRoad."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div>
                                            <span className="text-xs text-slate-400 block mb-0.5">{t('tours.from_price', { price: '' })}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    {parseInt(Number(tour.is_foreg || 0)).toLocaleString()}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">UZS</span>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/tours/${tour.id}`}
                                            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all"
                                        >
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('tours.no_tours')}</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your search filters.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
