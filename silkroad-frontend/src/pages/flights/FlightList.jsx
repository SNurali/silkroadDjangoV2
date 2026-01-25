import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, Clock, ArrowRight, Filter } from 'lucide-react';
import { searchFlights } from '../../services/api';

export default function FlightList() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlights = async () => {
            setLoading(true);
            try {
                // query params are automatically handled by searchParams.toString() in URL 
                const data = await searchFlights(Object.fromEntries(searchParams));
                setFlights(data.results || data); // Handle pagination or direct list
            } catch (err) {
                console.error("Failed to load flights", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlights();
    }, [searchParams]);

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const duration = (start, end) => {
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8 transition-colors duration-200">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('flights.results_title')}</h1>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1 hidden lg:block">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 sticky top-24 transition-colors">
                            <div className="flex items-center gap-2 mb-6">
                                <Filter size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-bold text-slate-800 dark:text-white">{t('flights.filters')}</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-gray-200 mb-3">{t('flights.stops')}</h4>
                                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2 cursor-pointer">
                                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700" />
                                        <span>{t('flights.direct')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700" />
                                        <span>{t('flights.one_stop')}</span>
                                    </label>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-gray-200 mb-3">{t('flights.price_range')}</h4>
                                    <input type="range" className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer h-2" />
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        <span>$100</span>
                                        <span>$2000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="lg:col-span-3 space-y-4">
                        {loading ? (
                            <div className="text-center py-20 text-slate-500 dark:text-slate-400">{t('flights.loading')}</div>
                        ) : flights.length > 0 ? (
                            flights.map((flight) => (
                                <div key={flight.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        {/* Airline Info */}
                                        <div className="flex items-center gap-4 min-w-[150px]">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
                                                {/* Fallback logo if no image */}
                                                <Plane size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{flight.airline.name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{flight.flight_number}</p>
                                            </div>
                                        </div>

                                        {/* Journey Info */}
                                        <div className="flex-1 flex items-center justify-center gap-8 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(flight.departure_time)}</p>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{flight.origin.code}</p>
                                            </div>

                                            <div className="flex flex-col items-center w-full max-w-[120px]">
                                                <p className="text-xs text-slate-400 mb-1">{duration(flight.departure_time, flight.arrival_time)}</p>
                                                <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-600 relative">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-2 transition-colors">
                                                        <Plane size={14} className="text-slate-400 rotate-90" />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{t('flights.direct')}</p>
                                            </div>

                                            <div>
                                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(flight.arrival_time)}</p>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{flight.destination.code}</p>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="text-right min-w-[150px] border-l border-slate-100 dark:border-slate-700 pl-6 border-transparent md:border-solid">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('flights.from_price', { price: '' })}</p>
                                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">${parseInt(flight.price_economy)}</p>
                                            <button
                                                onClick={() => navigate(`/flights/book/${flight.id}`)}
                                                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                                {t('flights.select')} <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center transition-colors">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Plane size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('flights.no_flights')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Valid routes for test: TAS to DXB, SKD to DXB.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
