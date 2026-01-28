import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, X, Star, MapPin, DollarSign, 
  Wifi, Car, Coffee, Utensils, Dumbbell, 
  ChevronDown, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HotelFilter = ({ 
  filters, 
  onFiltersChange, 
  onApply,
  className = ""
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Amenities mapping
  const amenities = [
    { id: 'wifi', label: t('filters.wifi'), icon: Wifi },
    { id: 'parking', label: t('filters.parking'), icon: Car },
    { id: 'restaurant', label: t('filters.restaurant'), icon: Utensils },
    { id: 'breakfast', label: t('filters.breakfast'), icon: Coffee },
    { id: 'fitness', label: t('filters.fitness'), icon: Dumbbell },
  ];

  // Regions/Cities for location filter
  const locations = [
    'Tashkent', 'Samarkand', 'Bukhara', 'Khiva', 'Nukus',
    'Fergana', 'Namangan', 'Andijan', 'Shakhrisabz'
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenityId) => {
    const currentAmenities = localFilters.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(id => id !== amenityId)
      : [...currentAmenities, amenityId];
    
    setLocalFilters(prev => ({
      ...prev,
      amenities: newAmenities
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      location: '',
      minPrice: 0,
      maxPrice: 5000,
      minRating: 0,
      amenities: [],
      propertyType: 'all'
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApply();
  };

  const FilterSection = ({ title, children, icon: Icon }) => (
    <div className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-b-0">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />}
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Filter Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-lg"
      >
        <SlidersHorizontal size={20} />
        <span>{t('filters.filter_button')}</span>
        <div className="relative">
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
          {Object.values(filters).some(value => 
            value && (Array.isArray(value) ? value.length > 0 : value !== '' && value !== 0)
          ) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </div>
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-full mt-2 left-0 w-full lg:w-[700px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Filter size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t('filters.advanced_filters')}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('filters.refine_your_search')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {/* Location Filter */}
                  <FilterSection title={t('filters.location')} icon={MapPin}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {locations.map(location => (
                        <button
                          key={location}
                          onClick={() => handleInputChange('location', location)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all text-center font-medium ${
                            localFilters.location === location
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'
                          }`}
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Price Range */}
                  <FilterSection title={t('filters.price_range')} icon={DollarSign}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t('filters.min_price')}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              value={localFilters.minPrice || 0}
                              onChange={(e) => handleInputChange('minPrice', parseInt(e.target.value) || 0)}
                              className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t('filters.max_price')}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              value={localFilters.maxPrice || 5000}
                              onChange={(e) => handleInputChange('maxPrice', parseInt(e.target.value) || 5000)}
                              className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="5000"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Price Slider */}
                      <div className="pt-2">
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="50"
                          value={localFilters.maxPrice || 5000}
                          onChange={(e) => handleInputChange('maxPrice', parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>$0</span>
                          <span className="font-medium text-indigo-600">${localFilters.maxPrice || 5000}</span>
                          <span>$5000</span>
                        </div>
                      </div>
                    </div>
                  </FilterSection>

                  {/* Rating Filter */}
                  <FilterSection title={t('filters.rating')} icon={Star}>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleInputChange('minRating', rating)}
                          className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all ${
                            localFilters.minRating === rating
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-800'
                          }`}
                        >
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <Star
                                key={star}
                                size={16}
                                className={`${
                                  star <= rating 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`font-medium ${
                            localFilters.minRating === rating
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {rating}+ {t('filters.stars')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Amenities Filter */}
                  <FilterSection title={t('filters.amenities')} icon={Coffee}>
                    <div className="grid grid-cols-2 gap-3">
                      {amenities.map(amenity => {
                        const IconComponent = amenity.icon;
                        const isSelected = localFilters.amenities?.includes(amenity.id);
                        
                        return (
                          <button
                            key={amenity.id}
                            onClick={() => handleAmenityToggle(amenity.id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800'
                            }`}
                          >
                            <IconComponent size={18} />
                            <span className="text-sm font-medium">{amenity.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FilterSection>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-1"
                >
                  {t('filters.reset')}
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex-1 flex items-center justify-center gap-2"
                >
                  <Filter size={18} />
                  {t('filters.apply_filters')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HotelFilter;