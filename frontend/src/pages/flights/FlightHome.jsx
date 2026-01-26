import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Search, ArrowRight } from 'lucide-react';
import api, { getAirports } from '../../services/api';

const AirportDropdown = ({ suggestions, onSelect, show }) => {
    if (!show || suggestions.length === 0) return null;
    return (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200">
            {suggestions.map((airport) => (
                <div
                    key={airport.id}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-100"
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        onSelect(airport);
                    }}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{airport.city} ({airport.code})</span>
                        <span className="text-xs text-slate-500">{airport.country_name}</span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{airport.name}</div>
                </div>
            ))}
        </div>
    );
};

export default function FlightHome() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // UI State for inputs (what user sees)
    const [originDisplay, setOriginDisplay] = useState('');
    const [destDisplay, setDestDisplay] = useState('');

    // Logic State (what api uses)
    const [selectedOriginCode, setSelectedOriginCode] = useState('');
    const [selectedDestCode, setSelectedDestCode] = useState('');
    const [date, setDate] = useState('');

    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [showOrigin, setShowOrigin] = useState(false);
    const [showDest, setShowDest] = useState(false);

    // Fetch airports for Origin
    useEffect(() => {
        const fetchOrigin = async () => {
            // Don't fetch if it looks like a selected item "City (CODE)"
            if (originDisplay.length < 2 || (originDisplay.includes('(') && originDisplay.includes(')'))) {
                setOriginSuggestions([]);
                return;
            }
            try {
                const results = await getAirports(originDisplay);
                setOriginSuggestions(results);
                setShowOrigin(true);
            } catch (e) {
                console.error(e);
            }
        };
        const timeout = setTimeout(fetchOrigin, 300);
        return () => clearTimeout(timeout);
    }, [originDisplay]);

    // Fetch airports for Destination
    useEffect(() => {
        const fetchDest = async () => {
            if (destDisplay.length < 2 || (destDisplay.includes('(') && destDisplay.includes(')'))) {
                setDestSuggestions([]);
                return;
            }
            try {
                const results = await getAirports(destDisplay);
                setDestSuggestions(results);
                setShowDest(true);
            } catch (e) {
                console.error(e);
            }
        };
        const timeout = setTimeout(fetchDest, 300);
        return () => clearTimeout(timeout);
    }, [destDisplay]);


    const handleSearch = (e) => {
        e.preventDefault();
        const params = {
            origin: selectedOriginCode || originDisplay,
            destination: selectedDestCode || destDisplay,
            date: date,
            passengers: 1
        };
        const query = new URLSearchParams(params).toString();
        navigate(`/flights/results?${query}`);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop"
                        alt="Flight Hero"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">{t('flights.hero_title') || 'Discover the World'}</h1>
                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">{t('flights.hero_subtitle') || 'Find the best flight deals to your dream destinations.'}</p>

                    {/* Search Form */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl max-w-5xl mx-auto shadow-2xl">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">

                            {/* Origin */}
                            <div className="lg:col-span-3 pb-2 relative">
                                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-500 transition-colors group">
                                    <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 group-hover:text-slate-300">{t('flights.from') || 'Origin'}</label>
                                    <div className="flex items-center gap-2 text-white">
                                        <MapPin size={18} className="text-indigo-400" />
                                        <input
                                            type="text"
                                            placeholder="City or Airport"
                                            className="bg-transparent border-none outline-none w-full placeholder-slate-500 text-white font-medium"
                                            value={originDisplay}
                                            onChange={(e) => {
                                                setOriginDisplay(e.target.value);
                                                setSelectedOriginCode(''); // Reset code on typing
                                            }}
                                            onFocus={() => originDisplay.length >= 2 && setShowOrigin(true)}
                                            onBlur={() => setTimeout(() => setShowOrigin(false), 200)}
                                            required
                                        />
                                    </div>
                                </div>
                                <AirportDropdown
                                    suggestions={originSuggestions}
                                    show={showOrigin}
                                    onSelect={(airport) => {
                                        const display = `${airport.city} (${airport.code})`;
                                        setOriginDisplay(display);
                                        setSelectedOriginCode(airport.code);
                                        setShowOrigin(false);
                                    }}
                                />
                            </div>

                            {/* Destination */}
                            <div className="lg:col-span-3 pb-2 relative">
                                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-500 transition-colors group">
                                    <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 group-hover:text-slate-300">{t('flights.to') || 'Destination'}</label>
                                    <div className="flex items-center gap-2 text-white">
                                        <MapPin size={18} className="text-pink-400" />
                                        <input
                                            type="text"
                                            placeholder="City or Airport"
                                            className="bg-transparent border-none outline-none w-full placeholder-slate-500 text-white font-medium"
                                            value={destDisplay}
                                            onChange={(e) => {
                                                setDestDisplay(e.target.value);
                                                setSelectedDestCode('');
                                            }}
                                            onFocus={() => destDisplay.length >= 2 && setShowDest(true)}
                                            onBlur={() => setTimeout(() => setShowDest(false), 200)}
                                            required
                                        />
                                    </div>
                                </div>
                                <AirportDropdown
                                    suggestions={destSuggestions}
                                    show={showDest}
                                    onSelect={(airport) => {
                                        const display = `${airport.city} (${airport.code})`;
                                        setDestDisplay(display);
                                        setSelectedDestCode(airport.code);
                                        setShowDest(false);
                                    }}
                                />
                            </div>

                            {/* Date */}
                            <div className="lg:col-span-3">
                                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-500 transition-colors group">
                                    <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 group-hover:text-slate-300">{t('flights.date') || 'Departure'}</label>
                                    <div className="flex items-center gap-2 text-white">
                                        <Calendar size={18} className="text-blue-400" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-none outline-none w-full text-white placeholder-slate-500 dark-date-input"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="lg:col-span-3 flex">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-lg">
                                    <Search size={20} />
                                    {t('flights.search_btn') || 'Search Flights'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Popular Destinations */}
            <section className="py-20 container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('flights.popular_destinations') || 'Popular Destinations'}</h2>
                    <p className="text-slate-600 dark:text-slate-400">{t('flights.popular_subtitle') || 'Explore our most popular flight routes.'}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Destination Cards (Local Assets) */}
                    {[
                        { name: 'Dubai, UAE', image: '/images/destinations/dubai.png', price: '$250', code: 'DXB' },
                        { name: 'Tashkent, UZ', image: '/images/destinations/tashkent.png', price: '$180', code: 'TAS' },
                        { name: 'Istanbul, TR', image: '/images/destinations/istanbul.png', price: '$320', code: 'IST' },
                        { name: 'New York, USA', image: '/images/destinations/newyork.png', price: '$650', code: 'JFK' },
                    ].map((dest, i) => (
                        <div
                            key={i}
                            className="group relative rounded-2xl overflow-hidden shadow-lg aspect-[4/5] cursor-pointer"
                            onClick={() => {
                                setDestDisplay(`${dest.name} (${dest.code})`);
                                setSelectedDestCode(dest.code);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <img
                                src={dest.image}
                                alt={dest.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop'}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                <div className="absolute bottom-0 left-0 p-6">
                                    <h3 className="text-xl font-bold text-white mb-1">{dest.name}</h3>
                                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                                        <span>From {dest.price}</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
