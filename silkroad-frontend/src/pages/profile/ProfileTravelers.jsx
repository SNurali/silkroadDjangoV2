import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2, Edit2, User, UserPlus, ShieldCheck, MapPin, Calendar, X } from 'lucide-react';
import api from '../../services/api';
import ProfileLayout from './ProfileLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileTravelers() {
    const { t } = useTranslation();
    const [travelers, setTravelers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchTravelers();
    }, []);

    const fetchTravelers = async () => {
        try {
            const res = await api.get('/accounts/travelers/');
            setTravelers(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch travelers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/accounts/travelers/${formData.id}/`, formData);
            } else {
                await api.post('/accounts/travelers/', formData);
            }
            setShowModal(false);
            setFormData(initialFormState);
            fetchTravelers();
        } catch (err) {
            console.error("Failed to save traveler", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.confirm_delete', 'Are you sure?'))) return;
        try {
            await api.delete(`/accounts/travelers/${id}/`);
            setTravelers(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const openEdit = (traveler) => {
        setFormData(traveler);
        setIsEditing(true);
        setShowModal(true);
    };

    const openCreate = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setShowModal(true);
    };

    return (
        <ProfileLayout activePage="travelers">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[600px] transition-all">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <Users size={28} className="text-indigo-600 dark:text-indigo-400" />
                            {t('profile.menu.travelers')}
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1 italic">
                            {t('profile.travelers_subtitle', 'Manage your companions for fast booking')}
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        {t('common.add_new', 'Add Companion')}
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('common.loading')}</p>
                        </div>
                    ) : travelers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 shadow-sm border border-slate-50 dark:border-slate-700">
                                <UserPlus size={40} />
                            </div>
                            <h3 className="font-black text-xl text-slate-700 dark:text-slate-300 uppercase tracking-tighter italic mb-2">No Companions Found</h3>
                            <p className="text-slate-400 font-medium text-center max-w-xs mb-8">Add your family or friends to make future bookings effortless.</p>
                            <button
                                onClick={openCreate}
                                className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                            >
                                Register First Companion
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {travelers.map(t => (
                                <motion.div
                                    layout
                                    key={t.id}
                                    className="group bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl italic border border-slate-100 dark:border-slate-700 shadow-sm">
                                                {t.first_name[0]}{t.last_name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-1">
                                                    {t.first_name} {t.last_name}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                    <ShieldCheck size={12} />
                                                    {t.passport_number}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(t)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all active:scale-90">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={10} className="text-indigo-500/50" />
                                                Birth Date
                                            </span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.birth_date}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <MapPin size={10} className="text-indigo-500/50" />
                                                Citizenship
                                            </span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.citizenship}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative border border-white/20 dark:border-slate-700"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        {isEditing ? 'Edit Companion' : 'New Companion'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traveler Details</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-100 dark:border-slate-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormInput
                                        label="First Name"
                                        value={formData.first_name}
                                        onChange={v => setFormData({ ...formData, first_name: v })}
                                        required
                                        placeholder="John"
                                    />
                                    <FormInput
                                        label="Last Name"
                                        value={formData.last_name}
                                        onChange={v => setFormData({ ...formData, last_name: v })}
                                        required
                                        placeholder="Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormInput
                                        label="Date of Birth"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={v => setFormData({ ...formData, birth_date: v })}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Gender</label>
                                        <div className="flex gap-4">
                                            {['male', 'female'].map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, gender: g })}
                                                    className={`flex-1 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${formData.gender === g ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-transparent border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormInput
                                        label="Passport Number"
                                        value={formData.passport_number}
                                        onChange={v => setFormData({ ...formData, passport_number: v.toUpperCase() })}
                                        required
                                        placeholder="AA1234567"
                                        extraClass="font-mono uppercase"
                                    />
                                    <FormInput
                                        label="Expiry Date"
                                        type="date"
                                        value={formData.passport_expiry || ''}
                                        onChange={v => setFormData({ ...formData, passport_expiry: v })}
                                    />
                                </div>

                                <FormInput
                                    label="Citizenship"
                                    value={formData.citizenship}
                                    onChange={v => setFormData({ ...formData, citizenship: v })}
                                    placeholder="Uzbekistan"
                                />

                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                    >
                                        {isEditing ? 'Commit Changes' : 'Save Companion'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ProfileLayout>
    );
}

const FormInput = ({ label, value, onChange, type = "text", required = false, placeholder = "", extraClass = "" }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{label}</label>
        <input
            type={type}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner ${extraClass}`}
        />
    </div>
);

const initialFormState = {
    first_name: '',
    last_name: '',
    middle_name: '',
    birth_date: '',
    gender: 'male',
    passport_number: '',
    passport_expiry: '',
    citizenship: 'Uzbekistan'
};
