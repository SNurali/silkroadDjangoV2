import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, Map as MapIcon } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function VendorTourList() {
    const { t } = useTranslation();
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            const res = await api.get('/vendors/tours/');
            setTours(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch tours", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('vendor_tours.delete_confirm'))) return;
        try {
            await api.delete(`/vendors/tours/${id}/`);
            setTours(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
            alert(t('vendor_tours.delete_error'));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('vendor_tours.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('vendor_tours.subtitle')}</p>
                </div>
                {tours.length > 0 && (
                    <button onClick={() => navigate('/vendor/tours/create')} className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/30">
                        <Plus size={18} />
                        <span>{t('vendor_tours.add_tour')}</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">{t('vendor_tours.loading')}</div>
            ) : tours.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-[60vh] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-purple-50 text-[#6366f1] rounded-full flex items-center justify-center mb-6">
                        <MapIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('vendor_tours.no_tours_title')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">{t('vendor_tours.no_tours_desc')}</p>
                    <button onClick={() => navigate('/vendor/tours/create')} className="text-[#6366f1] font-bold hover:text-[#4f46e5] transition-colors">
                        {t('vendor_tours.create_tour')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map(tour => (
                        <div key={tour.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative h-48 bg-slate-200">
                                {(() => {
                                    const raw = tour.images;
                                    // Debug log for the user in console to inspect what backend returns
                                    console.log('Tour ID:', tour.id, 'Raw Images:', raw, typeof raw);

                                    let src = null;

                                    if (Array.isArray(raw) && raw.length > 0) {
                                        src = raw[0];
                                    } else if (typeof raw === 'string') {
                                        // Aggressively clean: remove [ ] " ' and extra spaces
                                        // "['/url']" -> "/url"
                                        let cleaned = raw.replace(/[\[\]"']/g, '');

                                        // If comma separated, take first
                                        if (cleaned.includes(',')) {
                                            src = cleaned.split(',')[0].trim();
                                        } else {
                                            src = cleaned.trim();
                                        }
                                    }

                                    if (src && src.length > 2) {
                                        return (
                                            <img
                                                src={src}
                                                alt={tour.name}
                                                className="w-full h-full object-cover relative z-10 bg-slate-200"
                                                onError={(e) => {
                                                    console.warn('Image failed to load:', src);
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        );
                                    }
                                    return null;
                                })()}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                                    <MapIcon size={48} className="opacity-20" />
                                </div>

                                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm z-10 ${tour.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {tour.status}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate">{tour.name}</h3>
                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    <MapPin size={14} />
                                    <span className="truncate">{tour.address}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        {parseInt(tour.is_foreg || 0).toLocaleString()} UZS
                                        <span className="text-xs font-normal text-slate-400"> {t('tours.per_person')}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => navigate(`/vendor/tours/edit/${tour.id}`)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(tour.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
