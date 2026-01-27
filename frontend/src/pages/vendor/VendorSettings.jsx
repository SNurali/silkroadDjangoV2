import React, { useEffect, useState } from 'react';
import { Save, User, CreditCard, Bell, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function VendorSettings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        company_name: '', full_name: '', email: '', phone: '',
        passport: '', dtb: '', sex: '', id_citizen: '',
        inn: '', mfo: '', checking_account: '', business_type: '',
        bill_data: {}, attributes: {}
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/vendors/settings/');
            setFormData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/vendors/settings/', formData);
            toast.success(t('common.saved'));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (parent, key, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [key]: value }
        }));
    };

    const renderProfileTab = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.profile_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.company_name')}</label>
                    <input name="company_name" value={formData.company_name || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.full_name')}</label>
                    <input name="full_name" value={formData.full_name || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.email')}</label>
                    <input name="email" value={formData.email || ''} disabled className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.phone')}</label>
                    <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" type="tel" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.dob')}</label>
                    <input name="dtb" type="date" value={formData.dtb || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.passport')}</label>
                    <input name="passport" value={formData.passport || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase" placeholder="AA1234567" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.gender')}</label>
                    <select name="sex" value={formData.sex || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        <option value="">{t('vendor_settings.select_gender')}</option>
                        <option value="M">{t('vendor_settings.gender_male')}</option>
                        <option value="F">{t('vendor_settings.gender_female')}</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderPaymentTab = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.payment_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-700">{t('vendor_settings.payment_alert')}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.bank_name')}</label>
                    <input
                        value={formData.bill_data?.bank_name || ''}
                        onChange={(e) => handleNestedChange('bill_data', 'bank_name', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="e.g. Kapital Bank"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.holder_name')}</label>
                    <input
                        value={formData.bill_data?.holder_name || ''}
                        onChange={(e) => handleNestedChange('bill_data', 'holder_name', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Match passport name"
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.account_number')}</label>
                    <input
                        value={formData.bill_data?.account_number || ''}
                        onChange={(e) => handleNestedChange('bill_data', 'account_number', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        placeholder="UZ..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.swift')}</label>
                    <input
                        value={formData.bill_data?.swift || ''}
                        onChange={(e) => handleNestedChange('bill_data', 'swift', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                    />
                </div>
            </div>
        </div>
    );

    const renderLegalTab = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.legal_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.inn')}</label>
                    <input name="inn" value={formData.inn || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="123456789" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.mfo')}</label>
                    <input name="mfo" value={formData.mfo || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="00444" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.business_type')}</label>
                    <input name="business_type" value={formData.business_type || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Tour Agency / Hotel" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_settings.checking_account')}</label>
                    <input name="checking_account" value={formData.checking_account || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono" placeholder="20208000..." />
                </div>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.notify_title')}</h3>

            <div className="flex items-center justify-between py-2">
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{t('vendor_settings.notify_email_title')}</p>
                    <p className="text-sm text-slate-500">{t('vendor_settings.notify_email_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.attributes?.notify_email !== false}
                        onChange={(e) => handleNestedChange('attributes', 'notify_email', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between py-2">
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{t('vendor_settings.notify_sms_title')}</p>
                    <p className="text-sm text-slate-500">{t('vendor_settings.notify_sms_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.attributes?.notify_sms === true}
                        onChange={(e) => handleNestedChange('attributes', 'notify_sms', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between py-2">
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{t('vendor_settings.notify_news_title')}</p>
                    <p className="text-sm text-slate-500">{t('vendor_settings.notify_news_desc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.attributes?.newsletter !== false}
                        onChange={(e) => handleNestedChange('attributes', 'newsletter', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>
    );

    const renderSecurityTab = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.security_title')}</h3>
                <div className="space-y-4">
                    <button className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">{t('vendor_settings.change_pass_title')}</p>
                            <p className="text-sm text-slate-500">{t('vendor_settings.change_pass_desc')}</p>
                        </div>
                        <span className="text-indigo-600 font-medium text-sm">{t('vendor_settings.update_btn')}</span>
                    </button>
                    <button className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">{t('vendor_settings.2fa_title')}</p>
                            <p className="text-sm text-slate-500">{t('vendor_settings.2fa_desc')}</p>
                        </div>
                        <span className="text-indigo-600 font-medium text-sm">{t('vendor_settings.enable_btn')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-50 dark:border-slate-700">{t('vendor_settings.sessions_title')}</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Chrome on Windows</p>
                                <p className="text-xs text-slate-500">Current Session • Tashkent, UZ</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{t('vendor_settings.session_active')}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const tabs = [
        { id: 'profile', label: t('vendor_settings.tabs_profile'), icon: User },
        { id: 'legal', label: t('vendor_settings.tabs_legal'), icon: CheckCircle },
        { id: 'payment', label: t('vendor_settings.tabs_payment'), icon: CreditCard },
        { id: 'notifications', label: t('vendor_settings.tabs_notifications'), icon: Bell },
        { id: 'security', label: t('vendor_settings.tabs_security'), icon: Lock },
    ];

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('vendor_settings.title')}</h1>
                <p className="text-slate-500 text-sm">{t('vendor_settings.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Settings Navigation */}
                <div className="space-y-1 h-fit sticky top-24">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all border ${activeTab === tab.id
                                ? 'dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-indigo-600 border-l-4 border-l-indigo-600'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white hover:shadow-sm border-transparent hover:border-slate-200'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'legal' && renderLegalTab()}
                    {activeTab === 'payment' && renderPaymentTab()}
                    {activeTab === 'notifications' && renderNotificationsTab()}
                    {activeTab === 'security' && renderSecurityTab()}

                    <div className="flex justify-end pt-6 border-t border-slate-200 mt-8">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-70"
                        >
                            <Save size={18} />
                            {saving ? t('vendor_settings.saving_btn') : t('vendor_settings.save_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
