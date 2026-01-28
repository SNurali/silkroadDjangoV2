import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_REGIONS = [
    { id: 'samarkand-reg', name: 'Samarkand Region', type: 'Region' },
    { id: 'bukhara-reg', name: 'Bukhara Region', type: 'Region' },
    { id: 'tashkent-reg', name: 'Tashkent Region', type: 'Region' },
    { id: 'khiva-reg', name: 'Khorezm Region', type: 'Region' },
];

const MOCK_CITIES = [
    { id: 'samarkand', name: 'Samarkand', type: 'City', region: 'Samarkand Region' },
    { id: 'bukhara', name: 'Bukhara', type: 'City', region: 'Bukhara Region' },
    { id: 'tashkent', name: 'Tashkent', type: 'City', region: 'Tashkent Region' },
    { id: 'khiva', name: 'Khiva', type: 'City', region: 'Khorezm Region' },
];

export default function LocationDropdown({ isOpen, onSelect, onClose, searchQuery }) {
    if (!isOpen) return null;

    const lowerQuery = searchQuery.toLowerCase();

    const filteredRegions = MOCK_REGIONS.filter(r =>
        r.name.toLowerCase().includes(lowerQuery)
    );

    const filteredCities = MOCK_CITIES.filter(c =>
        c.name.toLowerCase().includes(lowerQuery)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 mt-4 w-80 md:w-96 bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-[60]"
        >
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
                {/* Current Location Option */}
                <div
                    className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors mb-2 group"
                    onClick={() => onSelect({ name: 'Current Location', type: 'GPS' })}
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Navigation size={18} />
                    </div>
                    <div>
                        <div className="font-bold text-[#1C2E4A]">Nearby</div>
                        <div className="text-xs text-slate-500">Use my current location</div>
                    </div>
                </div>

                {filteredRegions.length > 0 && (
                    <div className="mb-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Regions</div>
                        {filteredRegions.map(region => (
                            <div
                                key={region.id}
                                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                onClick={() => onSelect(region)}
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-[#1C2E4A]">{region.name}</div>
                                    <div className="text-xs text-slate-400">Uzbekistan</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredCities.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Popular Cities</div>
                        {filteredCities.map(city => (
                            <div
                                key={city.id}
                                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                onClick={() => onSelect(city)}
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-[#1C2E4A]">{city.name}</div>
                                    <div className="text-xs text-slate-400">{city.region}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredRegions.length === 0 && filteredCities.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No locations found for "{searchQuery}"
                    </div>
                )}
            </div>
        </motion.div>
    );
}
