import React, { useState } from 'react';
import ProfileLayout from './ProfileLayout';
import ProfileSection from './ProfileSection';
import { useTranslation } from 'react-i18next';
import { Bell, Shield, Smartphone, LogOut, Save, Globe, Moon, Sun, Settings as SettingsIcon, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../services/api';

const ProfileSettings = () => {
    const { t, i18n } = useTranslation();
    const { logout } = useAuth();
    const [phone, setPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationMode, setConfirmationMode] = useState(false);
    const [loadingCode, setLoadingCode] = useState(false);

    const handleSendCode = async () => {
        if (!phone) return;
        setLoadingCode(true);
        try {
            const res = await api.post('/accounts/security/send-code/', { phone });
            // Simulate SMS arrival
            alert(`SMS Sent! (TEST MODE CODE: ${res.data.mock_code})`);
            setConfirmationMode(true);
        } catch (error) {
            console.error(error);
            alert('Failed to send code.');
        } finally {
            setLoadingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) return;
        setLoadingCode(true);
        try {
            await api.post('/accounts/security/verify-code/', { code: verificationCode });
            alert(t('common.saved'));
            setConfirmationMode(false);
            setVerificationCode('');
            // setPhone(''); // Optional: clear phone or keep it
        } catch (error) {
            console.error(error);
            alert('Invalid Code');
        } finally {
            setLoadingCode(false);
        }
    };

    const handleGlobalLogout = async () => {
        if (!window.confirm(t('common.confirm_delete') || 'Are you sure?')) return;
        try {
            await api.post('/accounts/security/global-logout/');
            logout();
        } catch (error) {
            console.error(error);
            logout();
        }
    };

    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Language State
    const [language, setLanguage] = useState(i18n.language || 'en');

    React.useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setLanguage(lang);
        document.cookie = `django_language=${lang}; path=/; max-age=31536000`;
    };

    // Notification States
    const [newsletter, setNewsletter] = useState('daily');
    const [preferences, setPreferences] = useState({
        loginNotification: true,
        bookingReminders: true,
        bookingPromotions: true,
        tripOffers: true,
        publicProfile: false,
        smsConfirmation: false,
        deviceCheck: true
    });

    const handlePreferenceChange = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        console.log("Saving preferences:", { newsletter, preferences });
        // TODO: Actually save via API
    };

    return (
        <ProfileLayout activePage="settings">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">

                {/* Visual Settings: Theme & Language */}
                <ProfileSection
                    title={t('settings.preferences_title', 'Visual Preferences')}
                    description={t('settings.preferences_desc', 'Customize your viewing experience and default language.')}
                >
                    <div className="space-y-10">
                        {/* Language */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Globe size={14} className="text-indigo-500" />
                                {t('settings.language_label', 'Interface Language')}
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { id: 'en', label: 'English', flag: '🇬🇧' },
                                    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
                                    { id: 'uz', label: "O'zbekcha", flag: '🇺🇿' }
                                ].map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => changeLanguage(lang.id)}
                                        className={`flex-1 min-w-[120px] flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all group ${language === lang.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none'
                                            : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{lang.id}</span>
                                            <span className="font-black italic uppercase tracking-tighter">{lang.label}</span>
                                        </div>
                                        <span className="text-xl group-hover:scale-125 transition-transform">{lang.flag}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Moon size={14} className="text-indigo-500" />
                                {t('settings.theme_label', 'Color Theme')}
                            </label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'light'
                                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xl shadow-amber-200'
                                        : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400'
                                        }`}
                                >
                                    <Sun size={20} className={theme === 'light' ? 'animate-spin-slow' : ''} />
                                    <span className="font-black uppercase text-xs tracking-widest italic">{t('settings.theme_daylight', 'Daylight')}</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${theme === 'dark'
                                        ? 'bg-indigo-900 border-indigo-500 text-indigo-100 shadow-xl shadow-indigo-900/40'
                                        : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400'
                                        }`}
                                >
                                    <Moon size={20} />
                                    <span className="font-black uppercase text-xs tracking-widest italic">{t('settings.theme_midnight', 'Midnight')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ProfileSection>

                {/* Notifications Section */}
                <ProfileSection
                    title={t('settings.notifications_title', 'Communication')}
                    description={t('settings.notifications_desc', 'Control how we reach out to you regarding your activities.')}
                    footer={
                        <button
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-10 rounded-xl transition-all shadow-lg shadow-indigo-200 text-xs uppercase tracking-widest"
                        >
                            <Save size={16} className="inline mr-2" />
                            {t('common.save_changes')}
                        </button>
                    }
                >
                    <div className="space-y-10">
                        {/* Newsletter Selection */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <Mail size={14} className="text-indigo-500" />
                                {t('settings.newsletter_label', 'Newsletter Frequency')}
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {['daily', 'twice_week', 'weekly', 'never'].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setNewsletter(option)}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-tighter italic ${newsletter === option
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                            : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200 shadow-inner'
                                            }`}
                                    >
                                        {t(`settings.freq_${option}`, option.replace('_', ' '))}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggle Switches */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 mb-4">
                                <Bell size={14} className="text-indigo-500" />
                                {t('settings.switches_label', 'Push & Email Alerts')}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'loginNotification', label: t('settings.notify_login', 'Login Alerts'), desc: t('settings.notify_login_desc', 'Receive security alerts for account access.') },
                                    { id: 'bookingReminders', label: t('settings.notify_reminders', 'Booking Guides'), desc: t('settings.notify_reminders_desc', 'Travel tips and reminders for your trips.') },
                                    { id: 'bookingPromotions', label: t('settings.notify_promotions', 'Flash Deals'), desc: t('settings.notify_promotions_desc', 'Exclusive discounts on hotels and tours.') },
                                    { id: 'publicProfile', label: t('settings.public_profile', 'Public Discovery'), desc: t('settings.public_profile_desc', 'Allow others to view your travel stats.') }
                                ].map(pref => (
                                    <div key={pref.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all shadow-sm">
                                        <div>
                                            <h6 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200 tracking-tight italic">{pref.label}</h6>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{pref.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePreferenceChange(pref.id)}
                                            className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${preferences[pref.id] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <motion.div
                                                animate={{ x: preferences[pref.id] ? 24 : 0 }}
                                                className="w-6 h-6 bg-white rounded-full shadow-sm shadow-black/20"
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ProfileSection>

                {/* Security Section */}
                <ProfileSection
                    title={t('settings.security_title', 'System Security')}
                    description={t('settings.security_desc', 'Monitor your active sessions and enhance account safety.')}
                >
                    <div className="space-y-10">
                        {/* Two Factor */}
                        <div className="space-y-4">
                            <h6 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200 tracking-widest flex items-center gap-3 italic">
                                <Smartphone size={16} className="text-indigo-500" />
                                {t('settings.2fa_title', 'Phone Shield')}
                            </h6>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-sm">
                                {t('settings.2fa_desc', 'Use your mobile device to verify high-risk actions.')}
                            </p>
                            <div className="flex gap-4">
                                {!confirmationMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+998 -- --- -- --"
                                            className="flex-1 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all font-black text-indigo-600 tracking-widest shadow-inner placeholder:italic placeholder:font-normal placeholder:opacity-30"
                                        />
                                        <button
                                            onClick={handleSendCode}
                                            disabled={loadingCode}
                                            className="px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 shrink-0 disabled:opacity-50"
                                        >
                                            {loadingCode ? t('common.loading') : t('settings.send_code')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter Code (123456)"
                                            className="flex-1 px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-black text-indigo-600 tracking-widest shadow-inner text-center text-lg"
                                        />
                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={loadingCode}
                                            className="px-8 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 shrink-0 disabled:opacity-50"
                                        >
                                            {loadingCode ? t('common.loading') : 'VERIFY'}
                                        </button>
                                        <button
                                            onClick={() => setConfirmationMode(false)}
                                            className="px-4 py-4 text-slate-400 hover:text-slate-600 font-bold text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-10 border-t border-slate-50 dark:border-slate-800">
                            <h6 className="font-black text-xs uppercase text-slate-800 dark:text-slate-200 tracking-widest mb-2 italic">{t('settings.global_signout', 'Global Sign Out')}</h6>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 max-w-sm leading-relaxed">
                                {t('settings.signout_desc', 'Instantly terminate all active sessions across web and mobile platforms.')}
                            </p>
                            <button
                                onClick={handleGlobalLogout}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-rose-100 dark:border-rose-900/50 group"
                            >
                                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                {t('auth.logout')} {t('settings.logout_all', 'All Devices')}
                            </button>
                        </div>
                    </div>
                </ProfileSection>

            </div>
        </ProfileLayout>
    );
};

export default ProfileSettings;
