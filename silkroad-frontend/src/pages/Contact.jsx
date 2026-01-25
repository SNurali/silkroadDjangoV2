import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send, Github, Twitter, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Contact() {
    const { t } = useTranslation();

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-12">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
                    >
                        {t('contact.title')}
                    </motion.h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">{t('contact.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </span>
                                {t('contact.info_title')}
                            </h3>

                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('contact.email_us')}</p>
                                        <p className="text-slate-900 dark:text-white font-medium italic underline">support@silkroad.com</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('contact.call_us')}</p>
                                        <p className="text-slate-900 dark:text-white font-medium">+998 71 123-45-67</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('contact.our_office')}</p>
                                        <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
                                            15 Amir Temur Avenue, Tashkent,<br />Uzbekistan
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-400 uppercase mb-4">{t('contact.follow_us')}</p>
                                <div className="flex gap-4">
                                    {[Twitter, Instagram, Github].map((Icon, i) => (
                                        <button key={i} className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all">
                                            <Icon size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <form className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('contact.first_name')}</label>
                                    <input type="text" placeholder="John" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('contact.last_name')}</label>
                                    <input type="text" placeholder="Doe" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2 mb-8">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('contact.your_email')}</label>
                                <input type="email" placeholder="john@example.com" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 ring-blue-500 outline-none" />
                            </div>
                            <div className="space-y-2 mb-8">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('contact.subject')}</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 ring-blue-500 outline-none">
                                    <option>{t('contact.subjects.general')}</option>
                                    <option>{t('contact.subjects.booking')}</option>
                                    <option>{t('contact.subjects.partnership')}</option>
                                    <option>{t('contact.subjects.feedback')}</option>
                                </select>
                            </div>
                            <div className="space-y-2 mb-10">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('contact.message')}</label>
                                <textarea rows="6" placeholder="How can we help you?" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 ring-blue-500 outline-none resize-none"></textarea>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                {t('contact.send_btn')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
