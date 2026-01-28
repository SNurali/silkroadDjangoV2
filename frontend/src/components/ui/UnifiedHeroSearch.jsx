import React, { useState, useRef, useEffect } from 'react';
import {
    Search, MapPin, Calendar, Users, Star,
    Plane, Briefcase, Car, Navigation, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ru, uz, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { clsx } from 'clsx';
import LocationDropdown from './LocationDropdown';
import { getCookie } from '../../utils/i18n';

export default function UnifiedHeroSearch({
    onSearch,
    initialActiveTab = 'hotels',
    initialData = {}
}) {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [location, setLocation] = useState(initialData.location || '');
    const [startDate, setStartDate] = useState(initialData.startDate || null);
    const [endDate, setEndDate] = useState(initialData.endDate || null);
    const [adults, setAdults] = useState(initialData.adults || 2);
    const [children, setChildren] = useState(initialData.children || 0);
    const [rooms, setRooms] = useState(initialData.rooms || 1);

    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [isLocationFocused, setIsLocationFocused] = useState(false);

    // Refs for click outside
    const containerRef = useRef(null);
    const locationInputRef = useRef(null);

    const lang = getCookie('django_language');
    const dateLocale = lang === 'ru' ? ru : lang === 'uz' ? uz : enUS;

    const tabs = [
        { id: 'hotels', label: 'Hotels', icon: Star },
        { id: 'flights', label: 'Flights', icon: Plane },
        { id: 'tours', label: 'Tours', icon: Briefcase }, // Changed icon to Briefcase for tours
        { id: 'cabs', label: 'Transfer', icon: Car },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowLocationPopup(false);
                setIsLocationFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Reset or adjust fields based on tab if needed
    };

    const handleLocationSelect = (item) => {
        setLocation(item.name);
        setShowLocationPopup(false);
    };

    const handleSearchClick = () => {
        onSearch({
            type: activeTab,
            location,
            startDate,
            endDate,
            adults,
            children,
            rooms
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4" ref={containerRef}>
            {/* Unified Container */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[32px] overflow-hidden transition-all duration-300 hover:bg-white/90">

                {/* Tabs Row */}
                <div className="flex items-center px-1 pt-1 border-b border-slate-900/5 bg-white/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-8 py-5 font-bold text-sm transition-all duration-300 relative outline-none",
                                activeTab === tab.id
                                    ? "text-[#1C2E4A]"
                                    : "text-slate-500 hover:text-[#1C2E4A]/80 hover:bg-white/40"
                            )}
                        >
                            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span className="uppercase tracking-widest text-xs">{tab.label}</span>

                            {/* Active Indicator */}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1C2E4A] rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Inputs Row */}
                <div className="p-3">
                    <div className="flex flex-col md:flex-row items-center gap-2">

                        {/* Dynamic Fields based on Tab */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 w-full grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr] gap-2 md:gap-0 md:divide-x divide-slate-900/5"
                            >
                                {/* --- HOTELS FIELDS --- */}
                                {activeTab === 'hotels' && (
                                    <>
                                        {/* Location Field */}
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4 cursor-text" onClick={() => { setShowLocationPopup(true); locationInputRef.current?.focus(); }}>
                                                <div className="w-10 h-10 rounded-full bg-[#1C2E4A]/5 flex items-center justify-center group-hover:bg-[#1C2E4A]/10 transition-colors shrink-0">
                                                    <MapPin className="text-[#1C2E4A]" size={20} />
                                                </div>
                                                <div className="flex-1 w-full min-w-0">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Location</label>
                                                    <input
                                                        ref={locationInputRef}
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => {
                                                            setLocation(e.target.value);
                                                            setShowLocationPopup(true);
                                                        }}
                                                        onFocus={() => setShowLocationPopup(true)}
                                                        placeholder="Where are you going?"
                                                        className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg placeholder:text-slate-300 focus:ring-0 leading-none truncate"
                                                    />
                                                </div>
                                            </div>
                                            <LocationDropdown
                                                isOpen={showLocationPopup}
                                                searchQuery={location}
                                                onSelect={handleLocationSelect}
                                                onClose={() => setShowLocationPopup(false)}
                                            />
                                        </div>

                                        {/* Date Field */}
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4 cursor-pointer h-full">
                                                <div className="w-10 h-10 rounded-full bg-[#1C2E4A]/5 flex items-center justify-center group-hover:bg-[#1C2E4A]/10 transition-colors shrink-0">
                                                    <Calendar className="text-[#1C2E4A]" size={20} />
                                                </div>
                                                <div className="flex-1 w-full overflow-hidden">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Check-in — Check-out</label>
                                                    <div className="relative w-full">
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
                                                            placeholderText="Add dates"
                                                            locale={dateLocale}
                                                            className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg placeholder:text-slate-300 focus:ring-0 leading-none cursor-pointer"
                                                            minDate={new Date()}
                                                            monthsShown={2}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guests Field */}
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4 cursor-pointer h-full">
                                                <div className="w-10 h-10 rounded-full bg-[#1C2E4A]/5 flex items-center justify-center group-hover:bg-[#1C2E4A]/10 transition-colors shrink-0">
                                                    <Users className="text-[#1C2E4A]" size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Guests</label>
                                                    <div className="text-[#1C2E4A] font-extrabold text-lg leading-none truncate">
                                                        {adults + children} Guests, {rooms} Room
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- FLIGHTS FIELDS --- */}
                                {activeTab === 'flights' && (
                                    <>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <MapPin className="text-[#1C2E4A]" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">From</label>
                                                    <input type="text" placeholder="Origin" className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg focus:ring-0" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <MapPin className="text-[#1C2E4A]" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">To</label>
                                                    <input type="text" placeholder="Destination" className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg focus:ring-0" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="text-[#1C2E4A]" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates</label>
                                                    <div className="text-[#1C2E4A] font-extrabold text-lg">Add Dates</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- TOURS FIELDS --- */}
                                {activeTab === 'tours' && (
                                    <>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors md:col-span-2">
                                            <div className="flex items-center gap-4">
                                                <Search className="text-amber-500" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</label>
                                                    <input type="text" placeholder="Where do you want to go?" className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg focus:ring-0" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="text-amber-500" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">When</label>
                                                    <div className="text-[#1C2E4A] font-extrabold text-lg">Anytime</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- CABS FIELDS --- */}
                                {activeTab === 'cabs' && (
                                    <>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <MapPin className="text-emerald-500" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pickup</label>
                                                    <input type="text" placeholder="Location" className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg focus:ring-0" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <MapPin className="text-emerald-500" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dropoff</label>
                                                    <input type="text" placeholder="Destination" className="w-full bg-transparent border-none p-0 text-[#1C2E4A] font-extrabold text-lg focus:ring-0" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group px-4 py-2 hover:bg-white/50 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="text-emerald-500" size={20} />
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</label>
                                                    <div className="text-[#1C2E4A] font-extrabold text-lg">Select</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Search Button */}
                        <div className="p-1 pl-2">
                            <button
                                onClick={handleSearchClick}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1C2E4A] to-[#2A4365] hover:scale-110 text-white flex items-center justify-center shadow-2xl shadow-blue-900/30 active:scale-95 transition-all duration-300 group"
                            >
                                <Search size={28} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
