import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, FileText, Clock, CreditCard, HelpCircle,
    ArrowRight, ExternalLink, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import VisaStepper from './visa/VisaStepper';

export default function Visa() {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(1);

    // Auto-advance stepper for demo effect
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev < 6 ? prev + 1 : 1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const faqs = [
        { q: t('visa.faq_title_1', 'Who needs a visa for Uzbekistan?'), a: t('visa.faq_ans_1', 'Citizens of many countries can enter visa-free or apply for an e-visa. Please check the official portal for specific requirements based on your nationality.') },
        { q: t('visa.faq_title_2', 'How long is the e-visa valid?'), a: t('visa.faq_ans_2', 'The e-visa is typically valid for 90 days from the date of issue and allows a stay of up to 30 days.') },
        { q: t('visa.faq_title_3', 'What is the processing time?'), a: t('visa.faq_ans_3', 'Standard processing takes 3 working days.') },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden">
            {/* Background Pattern (Girih Mock) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4A8D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            {/* --- Hero Section --- */}
            <section className="relative pt-32 pb-40 lg:pb-52 overflow-hidden">
                {/* Official Gradient Background */}
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#1B4A8D] to-[#163b70] z-0 rounded-b-[50px] lg:rounded-b-[100px] shadow-2xl" />

                {/* Hero Content */}
                <div className="max-w-7xl mx-auto px-4 text-center text-white relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-indigo-100 text-sm font-semibold border border-white/20 mb-6">
                            <span className="w-2 h-2 rounded-full bg-[#5BC0DE] animate-pulse" />
                            Official E-Visa Portal Guide
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                            {t('visa.hero_title', 'Simplifying Your Entry to Uzbekistan')}
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                            {t('visa.hero_subtitle', 'Secure your electronic visa in just 3 simple steps. Official process, secure payment, and instant delivery.')}
                        </p>
                    </motion.div>

                    {/* Official Action Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <a
                            href="https://e-visa.gov.uz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#5BC0DE] hover:bg-[#46b8da] text-white text-lg font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-3"
                        >
                            {t('visa.apply_btn', 'Start Application')}
                            <ExternalLink size={20} />
                        </a>
                    </motion.div>
                </div>

                {/* --- Floating Application Wizard Card --- */}
                <div className="relative z-20 -mt-20 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Header of Card */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-[#1B4A8D] dark:text-blue-400">Application Process</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Follow these 6 simple steps on the official portal</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400" />
                                <span className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400" />
                                <span className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400" />
                            </div>
                        </div>

                        {/* Stepper Content */}
                        <div className="p-8 md:p-12">
                            <VisaStepper currentStep={activeStep} />

                            <div className="mt-12 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex gap-4 items-start">
                                <div className="p-2 bg-[#1B4A8D] text-white rounded-lg flex-shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#1B4A8D] dark:text-blue-300 mb-1">Fast Processing</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        The entire process typically takes less than 10 minutes to complete. Once submitted, your visa will be processed within <strong>2-3 working days</strong> and sent directly to your email.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Visa Free Info --- */}
            <section className="py-24 max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#5BC0DE] font-bold uppercase tracking-wider text-sm mb-2 block">Eligibility</span>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1B4A8D] dark:text-white mb-6">
                            Visa-Free Entry
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                            Uzbekistan has opened its doors to the world. Citizens of more than <strong>90 countries</strong> can enter Uzbekistan visa-free for up to 30 days.
                        </p>

                        <div className="space-y-4">
                            {[
                                "No paperwork needed at the airport",
                                "Valid for tourism and short business trips",
                                "Simple passport control procedure"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle size={14} strokeWidth={3} />
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10">
                            <a href="https://mfa.uz/en/pages/visa-republic-uzbekistan" target="_blank" className="text-[#1B4A8D] dark:text-[#5BC0DE] font-bold hover:underline inline-flex items-center gap-2">
                                Check requirements for your country <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Visual Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#5BC0DE] rounded-3xl transform rotate-3 opacity-20 group-hover:rotate-6 transition-transform duration-500" />
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src="/frontend/evisa-passport-moment.jpg"
                                className="w-full h-full object-cover"
                                alt="Visa Free Travel"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1572507949774-32b0dd47d7c6?auto=format&fit=crop&q=80&w=800" }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1B4A8D]/90 to-transparent flex flex-col justify-end p-8">
                                <p className="text-white/80 text-sm uppercase tracking-widest font-bold mb-1">Welcome to Uzbekistan</p>
                                <p className="text-white text-2xl font-bold">Hassle-free Travel</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ Section --- */}
            <section className="bg-white dark:bg-slate-800 py-24 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-[#1B4A8D] dark:text-[#5BC0DE] rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <HelpCircle size={32} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-[#1B4A8D] dark:text-white mb-4">Frequently Asked Questions</h2>
                        <p className="text-slate-500">Common questions about the electronic visa system</p>
                    </div>

                    <div className="grid gap-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700/50 transition-colors"
                            >
                                <h4 className="font-bold text-[#1B4A8D] dark:text-blue-300 text-lg mb-2">{faq.q}</h4>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
