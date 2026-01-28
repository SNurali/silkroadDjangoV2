import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword, getCountries, syncEmehmonData } from '../services/api';
import ProfileLayout from './profile/ProfileLayout';
import ProfileSection from './profile/ProfileSection';
import { clsx } from 'clsx';
import { CheckCircle, Camera, Save, Lock, Mail, Phone, Globe, Calendar, User, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);

  // Profile Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    passport: '',
    sex: 'M',
    id_citizen: '',
    dtb: '',
    pspissuedt: '',
    completion_percent: 0,
    avatar_url: null,
    photo: null
  });

  // Password Data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    password_confirmation: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, countryList] = await Promise.all([
          getProfile(),
          getCountries()
        ]);

        setFormData({
          ...profileData,
          dtb: profileData.dtb || '',
          pspissuedt: profileData.pspissuedt || '',
          sex: profileData.sex || 'M',
          id_citizen: profileData.id_citizen || ''
        });

        setCountries(Array.isArray(countryList) ? countryList : []);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && key !== 'avatar_url' && key !== 'photo' && key !== 'completion_percent') {
        data.append(key, formData[key]);
      }
    });
    data.append('photo', file);

    try {
      const updated = await updateProfile(data);
      setFormData(prev => ({ ...prev, ...updated }));
      setStatus({ type: 'success', message: t('profile.success_update_photo', 'Photo updated!') });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: t('profile.fail_update_photo', 'Failed to update photo.') });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile(formData);
      setFormData(prev => ({ ...prev, ...updated }));
      setStatus({ type: 'success', message: t('profile.success_update') });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: t('profile.fail_update') });
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.password_confirmation) {
      setStatus({ type: 'error', message: t('profile.fail_pass_match', 'Passwords do not match.') });
      return;
    }
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setStatus({ type: 'success', message: t('profile.success_update') });
      setPasswordData({ current_password: '', new_password: '', password_confirmation: '' });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error.response?.data?.current_password?.[0] || t('profile.fail_update') });
    }
  };

  const [syncing, setSyncing] = useState(false);
  const handleSyncEmehmon = async () => {
    setSyncing(true);
    try {
      const res = await syncEmehmonData();
      setFormData(prev => ({ ...prev, foreign_data: res.data }));
      setStatus({ type: 'success', message: t('profile.sync_success', 'Data synchronized with E-Mehmon!') });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: t('profile.sync_fail', 'Sync failed. Please check your passport details.') });
    } finally {
      setSyncing(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('common.loading', 'Loading profile...')}</p>
      </div>
    </div>
  );

  return (
    <ProfileLayout activePage="profile">
      <div className="max-w-4xl mx-auto py-4">

        {/* E-Mehmon Foreigner Status Widget (Enterprise Phase 4) */}
        {user?.is_foreigner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-1">
                  E-Mehmon Citizen Status
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-emerald-500 text-[10px] font-black uppercase rounded">Verified</span>
                  <span className="text-xs font-bold text-indigo-100">Sync: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Visa Expiry</p>
                    <p className="font-bold">{formData.foreign_data?.visa_expiry_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Registration</p>
                    <p className="font-bold">{formData.foreign_data?.current_registration_place || 'No Active registration'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSyncEmehmon}
                disabled={syncing}
                className={clsx(
                  "px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95",
                  syncing ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-50"
                )}>
                {syncing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </div>
                ) : 'Re-Sync Data'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Status Notifications */}
        <AnimatePresence>
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-8 p-4 rounded-2xl flex items-center gap-4 border shadow-sm ${status.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                }`}
            >
              <div className={`p-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                {status.type === 'success' ? <CheckCircle size={18} /> : <Save size={18} />}
              </div>
              <span className="font-bold text-sm tracking-tight">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Information Section */}
        <ProfileSection
          title={t('profile.section_info_title', 'Profile Information')}
          description={t('profile.section_info_desc', "Update your account's profile information and email address.")}
          footer={
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 text-sm uppercase tracking-wider"
            >
              <Save size={18} />
              {t('profile.save_changes')}
            </button>
          }
        >
          <div className="space-y-10">
            {/* Profile Photo */}
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-800 shadow-xl transition-transform group-hover:scale-105 duration-500">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                      <User size={40} className="mb-2 opacity-50" />
                      <span className="text-[10px] uppercase font-black opacity-30 tracking-tighter">No Image</span>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-3 -right-3 p-3 bg-indigo-600 text-white rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg hover:rotate-12 active:scale-90 ring-4 ring-white dark:ring-slate-800">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter italic">
                  {t('profile.photo_management', 'Profile Photo')}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs font-medium">
                  {t('profile.photo_desc', 'JPG or PNG, max size of 2MB. Your photo is visible to vendors.')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000"
                      style={{ width: `${formData.completion_percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 italic">{formData.completion_percent}%</span>
                </div>
              </div>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.full_name')}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('login.email')}</label>
                <div className="relative group select-none cursor-not-allowed">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-bold outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 dark:bg-slate-700 rounded-md">
                    <Lock size={12} className="text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.phone')}</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.nationality')}</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <select
                    name="id_citizen"
                    value={formData.id_citizen || ''}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-4 ring-amber-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner appearance-none"
                    required
                  >
                    <option value="">{t('profile.select_country')}</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.dob')}</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="date"
                    name="dtb"
                    value={formData.dtb || ''}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.gender')}</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.sex === 'M' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-400 dark:text-indigo-300 shadow-lg shadow-indigo-200/20' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'}`}>
                    <input type="radio" name="sex" value="M" checked={formData.sex === 'M'} onChange={handleChange} className="hidden" />
                    <ShieldCheck size={16} className={formData.sex === 'M' ? 'opacity-100' : 'opacity-0'} />
                    <span className="font-bold uppercase text-xs tracking-widest">{t('profile.male')}</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.sex === 'F' ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/40 dark:border-rose-400 dark:text-rose-300 shadow-lg shadow-rose-200/20' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'}`}>
                    <input type="radio" name="sex" value="F" checked={formData.sex === 'F'} onChange={handleChange} className="hidden" />
                    <ShieldCheck size={16} className={formData.sex === 'F' ? 'opacity-100' : 'opacity-0'} />
                    <span className="font-bold uppercase text-xs tracking-widest">{t('profile.female')}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.passport')}</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="text"
                    name="passport"
                    value={formData.passport || ''}
                    onChange={handleChange}
                    placeholder="AA 1234567"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner placeholder:italic placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.issue_date')}</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    name="pspissuedt"
                    value={formData.pspissuedt || ''}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Password Section */}
        <ProfileSection
          title={t('profile.update_password')}
          description={t('profile.update_password_desc', 'Ensure your account is using a long, random password to stay secure.')}
          footer={
            <button
              onClick={handleSubmitPassword}
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 text-sm uppercase tracking-wider"
            >
              <Lock size={18} />
              {t('profile.change_password')}
            </button>
          }
        >
          <div className="space-y-8 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.current_password')}</label>
              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.new_password')}</label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest pl-1">{t('profile.confirm_password')}</label>
              <input
                type="password"
                name="password_confirmation"
                value={passwordData.password_confirmation}
                onChange={handlePasswordChange}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 shadow-inner"
                required
              />
            </div>
          </div>
        </ProfileSection>

      </div>
    </ProfileLayout>
  );
};

export default Profile;