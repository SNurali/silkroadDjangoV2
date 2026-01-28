import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Users,
  ChevronLeft, ChevronRight, X, Plane, Star
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, addDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from '../services/api';
import { getCookie } from '../utils/i18n';

const BeautifulSearchBar = ({
  onSearch,
  initialData = {},
  className = ""
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('hotels');
  const [formData, setFormData] = useState({
    location: initialData.location || '',
    checkIn: initialData.startDate || initialData.checkIn || null,
    checkOut: initialData.endDate || initialData.checkOut || null,
    guests: initialData.adults || initialData.guests || 2,
    children: initialData.children || 0,
    rooms: initialData.rooms || 1
  });

  const [activeField, setActiveField] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const lang = getCookie('django_language') || 'ru';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setActiveField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSearch = async (query) => {
    if (query.length > 1) {
      try {
        const response = await api.get(`/locations/search/?q=${encodeURIComponent(query)}&lang=${lang}`);
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (item) => {
    handleInputChange('location', item.display_name.toUpperCase());
    setShowSuggestions(false);
    setActiveField('checkIn');
  };

  const handleHotelSearch = () => {
    if (formData.location) {
      onSearch({
        location: formData.location,
        startDate: formData.checkIn,
        endDate: formData.checkOut,
        adults: formData.guests,
        children: formData.children,
        rooms: formData.rooms
      });
    }
  };

  const handleOtherSearch = (category) => {
    // Basic navigation or callback for other categories
    if (onSearch) {
      onSearch({ category, ...formData });
    }
  };

  const FieldButton = ({
    icon: Icon,
    label,
    value,
    onClick,
    isActive,
    placeholder,
    className = ""
  }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
        ${isActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
        }
        ${className}
      `}
    >
      <div className={`
        p-2 rounded-lg ${isActive
          ? 'bg-indigo-100 dark:bg-indigo-900/30'
          : 'bg-slate-100 dark:bg-slate-700'
        }`}
      >
        <Icon
          size={20}
          className={isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400'
          }
        />
      </div>
      <div className="text-left flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className={`
          font-semibold truncate ${isActive
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {value || placeholder}
        </div>
      </div>
      {isActive && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft size={16} className="text-indigo-500" />
        </motion.div>
      )}
    </motion.button>
  );

  return (
    <div ref={searchRef} className={`w-full max-w-6xl mx-auto ${className}`}>
      <div className="flex gap-2 mb-2 ml-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'hotels', label: t('home.tab_hotels'), icon: Star },
          { id: 'flights', label: t('home.tab_flights'), icon: Plane },
          { id: 'tours', label: t('home.tab_tours'), icon: Calendar },
          { id: 'cabs', label: t('home.tab_cabs'), icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-lg"
                : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden"
      >
        {activeTab === 'hotels' ? (
          <div className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Location Field */}
            <div className="relative">
              <FieldButton
                icon={MapPin}
                label={t('search.location')}
                value={formData.location}
                placeholder={t('search.where_to')}
                onClick={() => setActiveField('location')}
                isActive={activeField === 'location'}
              />

              <AnimatePresence>
                {activeField === 'location' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin size={20} className="text-indigo-500" />
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {t('search.select_destination')}
                      </h3>
                      <button
                        onClick={() => setActiveField(null)}
                        className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder={t('search.search_destinations')}
                      value={formData.location}
                      onChange={(e) => {
                        handleInputChange('location', e.target.value);
                        handleLocationSearch(e.target.value);
                      }}
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white"
                      autoFocus
                    />

                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 max-h-48 overflow-y-auto custom-scrollbar"
                        >
                          {suggestions.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => selectLocation(item)}
                              className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                  <MapPin size={14} className="text-indigo-500" />
                                  {item.display_name.toUpperCase()}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest ml-5">
                                  {item.type}
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Check-in Field */}
            <div className="relative">
              <FieldButton
                icon={Calendar}
                label={t('search.check_in')}
                value={formData.checkIn ? format(formData.checkIn, 'MMM dd, yyyy') : ''}
                placeholder={t('search.add_dates')}
                onClick={() => setActiveField('checkIn')}
                isActive={activeField === 'checkIn'}
              />

              <AnimatePresence>
                {activeField === 'checkIn' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {t('search.select_check_in')}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveField(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>

                    <DatePicker
                      selected={formData.checkIn}
                      onChange={(date) => {
                        handleInputChange('checkIn', date);
                        setActiveField('checkOut');
                      }}
                      inline
                      minDate={new Date()}
                      className="w-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Check-out Field */}
            <div className="relative">
              <FieldButton
                icon={Calendar}
                label={t('search.check_out')}
                value={formData.checkOut ? format(formData.checkOut, 'MMM dd, yyyy') : ''}
                placeholder={t('search.add_dates')}
                onClick={() => setActiveField('checkOut')}
                isActive={activeField === 'checkOut'}
              />

              <AnimatePresence>
                {activeField === 'checkOut' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {t('search.select_check_out')}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveField(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>

                    <DatePicker
                      selected={formData.checkOut}
                      onChange={(date) => {
                        handleInputChange('checkOut', date);
                        setActiveField('guests');
                      }}
                      inline
                      minDate={formData.checkIn || new Date()}
                      className="w-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Guests Field */}
            <div className="relative">
              <FieldButton
                icon={Users}
                label={t('search.guests')}
                value={`${formData.guests} ${t('search.guests_count')}, ${formData.rooms} ${t('search.rooms_count')}`}
                placeholder={t('search.add_guests')}
                onClick={() => setActiveField('guests')}
                isActive={activeField === 'guests'}
              />

              <AnimatePresence>
                {activeField === 'guests' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Users size={20} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {t('search.select_guests')}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveField(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Guests Counter */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {t('search.adults')}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {t('search.age_13_plus')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleInputChange('guests', Math.max(1, formData.guests - 1))}
                            disabled={formData.guests <= 1}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-lg text-slate-900 dark:text-white">
                            {formData.guests}
                          </span>
                          <button
                            onClick={() => handleInputChange('guests', formData.guests + 1)}
                            className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Rooms Counter */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {t('search.rooms')}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {t('search.number_of_rooms')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleInputChange('rooms', Math.max(1, formData.rooms - 1))}
                            disabled={formData.rooms <= 1}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-lg text-slate-900 dark:text-white">
                            {formData.rooms}
                          </span>
                          <button
                            onClick={() => handleInputChange('rooms', formData.rooms + 1)}
                            className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveField(null);
                        handleHotelSearch();
                      }}
                      className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      {t('search.search_button')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === 'flights' && <Plane className="text-indigo-600 dark:text-indigo-400" size={40} />}
              {activeTab === 'tours' && <Calendar className="text-indigo-600 dark:text-indigo-400" size={40} />}
              {activeTab === 'cabs' && <Users className="text-indigo-600 dark:text-indigo-400" size={40} />}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t(`home.search_${activeTab}_btn`)}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t(`home.service_${activeTab}_desc`)}
            </p>
            <button
              onClick={() => handleOtherSearch(activeTab)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              {t('home.view_all')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BeautifulSearchBar;