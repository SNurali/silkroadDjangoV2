import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building as BuildingIcon } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function VendorHotelList() {
    const { t } = useTranslation();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const res = await api.get('/vendors/hotels/');
            setHotels(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch hotels", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('vendor_hotels.delete_confirm'))) return;
        try {
            await api.delete(`/vendors/hotels/${id}/`);
            setHotels(prev => prev.filter(h => h.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
            alert(t('vendor_hotels.delete_error'));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('vendor_hotels.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('vendor_hotels.subtitle')}</p>
                </div>
                {hotels.length > 0 && (
                    <Link to="/vendor/hotels/create" className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/30">
                        <Plus size={18} />
                        <span>{t('vendor_hotels.add_hotel')}</span>
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">{t('vendor_hotels.loading')}</div>
            ) : hotels.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-[60vh] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-purple-50 text-[#6366f1] rounded-full flex items-center justify-center mb-6">
                        <BuildingIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('vendor_hotels.no_hotels_title')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">{t('vendor_hotels.no_hotels_desc')}</p>
                    <Link to="/vendor/hotels/create" className="text-[#6366f1] font-bold hover:text-[#4f46e5] transition-colors">
                        {t('vendor_hotels.create_hotel')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hotels.map(hotel => (
                        <div key={hotel.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative h-48 bg-slate-200">
                                {hotel.images_read && hotel.images_read[0] ? (
                                    <img
                                        src={hotel.images_read[0]}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400" style={{ display: hotel.images_read?.[0] ? 'none' : 'flex' }}>
                                    <BuildingIcon size={48} className="opacity-20" />
                                </div>
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm z-10">
                                    {hotel.stars} {t('vendor_hotel_create.stars')}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate">{hotel.name}</h3>
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    <MapPin size={14} />
                                    <span className="truncate">{hotel.address || hotel.region_name}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        {parseInt(hotel.deposit).toLocaleString()} UZS
                                        <span className="text-xs font-normal text-slate-400"> {t('hotel_detail.per_night')}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link to={`/vendor/hotels/edit/${hotel.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                            <Edit2 size={16} />
                                        </Link>
                                        <button onClick={() => handleDelete(hotel.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
