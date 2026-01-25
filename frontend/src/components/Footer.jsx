import React from 'react';
import { Facebook, Instagram, Linkedin, Twitter, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SilkRoadLogo from './SilkRoadLogo';

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="bg-slate-950 pt-20 pb-10 text-slate-400 border-t border-slate-900">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* Widget 1: Brand & Contact */}
                    <div className="lg:col-span-4">
                        <div className="inline-block mb-10 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                            <SilkRoadLogo className="text-5xl" />
                        </div>
                        <p className="mb-8 text-slate-500 text-sm leading-relaxed max-w-sm">
                            {t('footer.brand_intro', 'Explore the ancient paths with modern comfort. SilkRoad is your premier gateway to the hidden gems of Central Asia and beyond.')}
                        </p>
                        <div className="space-y-4">
                            <a href="tel:+1234568963" className="flex items-center gap-4 text-slate-300 hover:text-indigo-400 transition-colors group">
                                <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-indigo-500/10 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <span className="text-sm font-semibold">+1234 568 963</span>
                            </a>
                            <a href="mailto:info@silkroad.com" className="flex items-center gap-4 text-slate-300 hover:text-indigo-400 transition-colors group">
                                <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-indigo-500/10 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <span className="text-sm font-semibold">info@silkroad.com</span>
                            </a>
                        </div>
                    </div>

                    {/* Widget 2: Link Groups */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <h5 className="text-white font-bold mb-6 text-xs uppercase tracking-widest">{t('footer.page', 'Discover')}</h5>
                                <ul className="space-y-3 text-sm">
                                    <li><a href="#" className="hover:text-white transition-colors">About SilkRoad</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Our Heritage</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">News & Stories</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Travel Guides</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-white font-bold mb-6 text-xs uppercase tracking-widest">{t('footer.link', 'Services')}</h5>
                                <ul className="space-y-3 text-sm">
                                    <li><a href="#" className="hover:text-white transition-colors">Hotels & Stays</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Tours & Events</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Flight Booking</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Visa Support</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-white font-bold mb-6 text-xs uppercase tracking-widest">{t('footer.support', 'Support')}</h5>
                                <ul className="space-y-3 text-sm">
                                    <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-white font-bold mb-6 text-xs uppercase tracking-widest">Connect</h5>
                                <div className="flex flex-wrap gap-3">
                                    <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-[#3b5998] text-white transition-all hover:-translate-y-1">
                                        <Facebook size={16} fill="currentColor" />
                                    </a>
                                    <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white transition-all hover:-translate-y-1">
                                        <Instagram size={16} />
                                    </a>
                                    <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-[#1da1f2] text-white transition-all hover:-translate-y-1">
                                        <Twitter size={16} fill="currentColor" />
                                    </a>
                                    <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-[#0077b5] text-white transition-all hover:-translate-y-1">
                                        <Linkedin size={16} fill="currentColor" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-medium text-slate-600">
                        © 2026 SilkRoad Travel. All rights reserved.
                        <span className="mx-2">|</span>
                        Built for the modern explorer.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <div className="h-6 w-10 bg-white rounded-sm flex items-center justify-center p-1">
                                <span className="text-[6px] text-blue-900 font-black">VISA</span>
                            </div>
                            <div className="h-6 w-10 bg-white rounded-sm flex items-center justify-center p-1">
                                <span className="text-[6px] text-red-600 font-black">MASTER</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
