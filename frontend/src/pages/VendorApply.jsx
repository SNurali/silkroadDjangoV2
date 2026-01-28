import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Building, Upload, CheckCircle, Info, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

const VendorApply = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        brand_name: '',
        legal_name: '',
        tax_id: '',
        contact_email: '',
        phone: '',
        address: '',
        business_type: '',
        mfo: '',
        checking_account: '',
        bank_name: '',
        oked: ''
    });
    const [certificateFile, setCertificateFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (certificateFile) {
            data.append('certificate_image', certificateFile);
        }

        try {
            await api.post('/vendors/apply/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data || { message: 'Failed to submit application' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-slate-50">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner"
                >
                    <CheckCircle size={48} />
                </motion.div>
                <h1 className="text-4xl font-black mb-4 text-slate-900 uppercase tracking-tight">{t('vendor_apply.success_title')}</h1>
                <p className="text-slate-600 mb-10 max-w-md text-lg leading-relaxed">
                    {t('vendor_apply.success_text')}
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-amber-600 text-white px-12 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-700 transition shadow-lg shadow-amber-200"
                >
                    {t('vendor_apply.back_home')}
                </button>
            </div>
        );
    }

    const inputClasses = "w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400 font-medium";
    const labelClasses = "text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1";

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-5xl mx-auto p-8 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-14 text-center"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-widest mb-4 shadow-sm">
                        {t('vendor_apply.partners_badge')}
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
                        {t('vendor_apply.title')}
                    </h1>
                    <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        {t('vendor_apply.subtitle')}
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10 md:p-14 border border-slate-100 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-600 to-orange-600"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-50"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
                        {/* Section 1: Basic Information */}
                        <div className="md:col-span-2 flex items-center gap-3 border-b border-slate-100 pb-5 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Building size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('vendor_apply.general_info')}</h2>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.brand_name')}</label>
                            <input
                                type="text"
                                required
                                className={inputClasses}
                                value={formData.brand_name}
                                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                                placeholder="e.g. Samarkand Tours"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.legal_name')}</label>
                            <input
                                type="text"
                                required
                                className={inputClasses}
                                value={formData.legal_name}
                                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                                placeholder="e.g. OOO 'Nurali Travel'"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.tax_id')}</label>
                            <input
                                type="text"
                                required
                                className={inputClasses}
                                value={formData.tax_id}
                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                placeholder={t('vendor_apply.tax_id_placeholder')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.oked')}</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.oked}
                                onChange={(e) => setFormData({ ...formData, oked: e.target.value })}
                                placeholder={t('vendor_apply.oked_placeholder')}
                            />
                        </div>

                        {/* Section 2: Banking Details */}
                        <div className="md:col-span-2 flex items-center gap-3 border-b border-slate-100 pb-5 mt-8 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <Info size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('vendor_apply.banking_details')}</h2>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.bank_name')}</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.mfo')}</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.mfo}
                                onChange={(e) => setFormData({ ...formData, mfo: e.target.value })}
                                placeholder={t('vendor_apply.mfo_placeholder')}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.settlement_account')}</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.checking_account}
                                onChange={(e) => setFormData({ ...formData, checking_account: e.target.value })}
                                placeholder={t('vendor_apply.settlement_account_placeholder')}
                            />
                        </div>

                        {/* Section 3: Documents and Contacts */}
                        <div className="md:col-span-2 flex items-center gap-3 border-b border-slate-100 pb-5 mt-8 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('vendor_apply.docs_activity')}</h2>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.business_type')}</label>
                            <select
                                className={`${inputClasses} appearance-none cursor-pointer`}
                                value={formData.business_type}
                                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                            >
                                <option value="">{t('vendor_apply.select_type')}</option>
                                <option value="Hotel">{t('navbar.hotels')}</option>
                                <option value="Tours">{t('navbar.tours')}</option>
                                <option value="Transport">{t('navbar.cabs')}</option>
                                <option value="Sight">{t('navbar.sights', 'Sights')}</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.registration_certificate')}</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setCertificateFile(e.target.files[0])}
                                    className="hidden"
                                    id="cert-upload"
                                />
                                <label
                                    htmlFor="cert-upload"
                                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${certificateFile ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-white'}`}
                                >
                                    <span className={`text-sm font-medium truncate max-w-[200px] ${certificateFile ? 'text-amber-700' : 'text-slate-400'}`}>
                                        {certificateFile ? certificateFile.name : t('vendor_apply.upload_guvohnoma')}
                                    </span>
                                    <Upload size={18} className={certificateFile ? 'text-amber-600' : 'text-slate-400'} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.contact_email')}</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className={`${inputClasses} pl-12`}
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.phone_number')}</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className={`${inputClasses} pl-12`}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className={labelClasses}>{t('vendor_apply.business_address')}</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-5 text-slate-400" />
                                <textarea
                                    rows="2"
                                    className={`${inputClasses} pl-12 pt-4`}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-10 p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex gap-3 items-center">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
                            {typeof error === 'string' ? error : JSON.stringify(error)}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.01, translateY: -2 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="mt-14 w-full bg-slate-900 text-white px-8 py-5 rounded-[20px] font-black text-xl uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {t('vendor_apply.processing')}
                            </>
                        ) : (
                            <>
                                {t('vendor_apply.submit_application')}
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    →
                                </motion.span>
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="mt-10 text-center text-slate-400 text-sm font-medium">
                    {t('vendor_apply.terms_agree')} <span className="text-amber-600 hover:underline cursor-pointer">{t('vendor_apply.terms_link')}</span>
                </p>
            </div>
        </div>
    );
};

export default VendorApply;
