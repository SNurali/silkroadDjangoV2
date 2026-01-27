import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, Minus, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ru, uz, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { clsx } from 'clsx';
import api from '../../services/api';
import { getCookie } from '../../utils/i18n';

export default function CompactSearchBar({ onSearch, initialData = {} }) {
    const [location, setLocation] = useState(initialData.location || '');
    const [startDate, setStartDate] = useState(initialData.startDate || null);
    const [endDate, setEndDate] = useState(initialData.endDate || null);
    const [adults, setAdults] = useState(initialData.adults || 2);
    const [children, setChildren] = useState(initialData.children || 0);
    const [rooms, setRooms] = useState(initialData.rooms || 1);

    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [showGuestPopup, setShowGuestPopup] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const lang = getCookie('django_language');
    const dateLocale = lang === 'ru' ? ru : lang === 'uz' ? uz : enUS;

    const guestRef = useRef(null);
    const locationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (guestRef.current && !guestRef.current.contains(event.target)) setShowGuestPopup(false);
            if (locationRef.current && !locationRef.current.contains(event.target)) setShowLocationPopup(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Location suggestions logic
    useEffect(() => {
        if (!showLocationPopup) return;

        const fetchSuggestions = async () => {
            try {
                // If location is short, it will fetch defaults from the updated backend
                const res = await api.get(`/locations/search/?q=${encodeURIComponent(location)}&lang=${lang}`);
                setSuggestions(res.data);
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        };
        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [location, lang, showLocationPopup]);

    const handleSearchClick = () => {
        onSearch({ location, startDate, endDate, adults, children, rooms });
    };

    const Counter = ({ label, sublabel, count, setCount, min = 0, max = 10 }) => (
        <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0 group">
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight">{label}</span>
                <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">{sublabel}</span>
            </div>
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setCount(Math.max(min, count - 1))}
                    className="w-8 h-8 rounded-full border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                    disabled={count <= min}
                >
                    <Minus size={14} />
                </button>
                <span className="text-white font-black text-base w-4 text-center">{count}</span>
                <button
                    type="button"
                    onClick={() => setCount(Math.min(max, count + 1))}
                    className="w-8 h-8 rounded-full border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                    disabled={count >= max}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="bg-[#121214] border border-white/5 rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-stretch gap-1 relative z-50">

                {/* Location Box */}
                <div className="flex-1 min-w-0 relative" ref={locationRef}>
                    <div
                        onClick={() => setShowLocationPopup(true)}
                        className="h-16 flex items-center gap-4 px-6 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                        <MapPin className="text-white/30 group-hover:text-indigo-400 transition-colors" size={24} />
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{initialData.locationLabel || 'Location'}</span>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Select location"
                                className="bg-transparent border-none p-0 focus:ring-0 text-white font-bold text-sm placeholder:text-white/20 truncate"
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showLocationPopup && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-80 bg-[#1A1A1E] border border-white/5 shadow-3xl rounded-2xl overflow-hidden z-[60]"
                            >
                                <div className="max-h-80 overflow-y-auto no-scrollbar">
                                    {suggestions.map((item) => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            onClick={() => {
                                                setLocation(item.display_name);
                                                setShowLocationPopup(false);
                                            }}
                                            className="px-6 py-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                        >
                                            <div className="text-white font-bold text-sm">{item.display_name}</div>
                                            <div className="text-white/30 text-[10px] uppercase font-black tracking-widest mt-1 italic">{item.type}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="hidden md:block w-px bg-white/5 self-stretch my-4"></div>

                {/* Date Box */}
                <div className="flex-1 min-w-0 relative">
                    <div className="h-16 flex items-center gap-4 px-6 rounded-xl hover:bg-white/5 transition-colors group">
                        <Calendar className="text-white/30 group-hover:text-indigo-400 transition-colors" size={24} />
                        <div className="flex flex-col flex-1">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Check in - out</span>
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => {
                                    const [start, end] = update;
                                    setStartDate(start);
                                    setEndDate(end);
                                }}
                                dateFormat="dd MMM"
                                placeholderText="Select date"
                                locale={dateLocale}
                                className="bg-transparent border-none p-0 focus:ring-0 text-white font-bold text-sm placeholder:text-white/20 w-full cursor-pointer"
                                minDate={new Date()}
                            />
                        </div>
                    </div>
                </div>

                <div className="hidden md:block w-px bg-white/5 self-stretch my-4"></div>

                {/* Guests Box */}
                <div className="flex-1 min-w-0 relative" ref={guestRef}>
                    <div
                        onClick={() => setShowGuestPopup(!showGuestPopup)}
                        className="h-16 flex items-center gap-4 px-6 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                        <Users className="text-white/30 group-hover:text-indigo-400 transition-colors" size={24} />
                        <div className="flex flex-col flex-1 truncate">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Guests & rooms</span>
                            <span className="text-white font-bold text-sm truncate">
                                {adults + children} Guests {rooms} Room
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showGuestPopup && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full right-0 mt-3 w-80 bg-[#1A1A1E] border border-white/5 shadow-3xl rounded-2xl p-6 z-[60]"
                            >
                                <Counter label="Adults" sublabel="Ages 13 or above" count={adults} setCount={setAdults} min={1} />
                                <Counter label="Child" sublabel="Ages 13 below" count={children} setCount={setChildren} />
                                <Counter label="Rooms" sublabel="Max room 8" count={rooms} setCount={setRooms} min={1} max={8} />

                                <button
                                    onClick={() => setShowGuestPopup(false)}
                                    className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                >
                                    Apply Configuration
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search Button */}
                <div className="flex items-center justify-center p-1 pl-2">
                    <button
                        onClick={handleSearchClick}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 active:scale-90 transition-all group"
                    >
                        <Search size={24} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Premium DatePicker Styling Overrides */}
            <style>{`
                .react-datepicker-popper { z-index: 70 !important; }
                .react-datepicker {
                    background-color: #1A1A1E !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    border-radius: 1.5rem !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                    padding: 1rem !important;
                    color: white !important;
                }
                .react-datepicker__header {
                    background-color: transparent !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
                .react-datepicker__current-month, .react-datepicker__day-name {
                    color: white !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    font-size: 10px !important;
                }
                .react-datepicker__day {
                    color: rgba(255,255,255,0.6) !important;
                    border-radius: 0.75rem !important;
                    transition: all 0.2s !important;
                    font-weight: 600 !important;
                }
                .react-datepicker__day:hover {
                    background-color: rgba(255,255,255,0.05) !important;
                    color: #818cf8 !important;
                }
                .react-datepicker__day--selected, 
                .react-datepicker__day--in-range,
                .react-datepicker__day--in-selecting-range {
                    background-color: #4f46e5 !important;
                    color: white !important;
                }
                .react-datepicker__day--disabled {
                    opacity: 0.1 !important;
                }
            `}</style>
        </div>
    );
}
