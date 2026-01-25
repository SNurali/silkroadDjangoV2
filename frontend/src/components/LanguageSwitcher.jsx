import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = i18n.language || 'en';

    const changeLanguage = (lang) => {
        console.log(`Switching language to: ${lang}`);
        i18n.changeLanguage(lang);
        setIsOpen(false);
    };

    const languages = [
        { code: 'en', label: 'EN', flag: '🇺🇸' },
        { code: 'ru', label: 'RU', flag: '🇷🇺' },
        { code: 'uz', label: 'UZ', flag: '🇺🇿' },
    ];

    // Animation variants
    const containerVariants = {
        closed: {
            width: 48, // w-12 equivalent
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30
            }
        },
        open: {
            width: "auto",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30
            }
        }
    };

    const itemVariants = {
        closed: { opacity: 0, scale: 0, x: -20, width: 0, display: "none" },
        open: {
            opacity: 1,
            scale: 1,
            x: 0,
            width: "auto",
            display: "flex",
            transition: { type: "spring", stiffness: 300, damping: 25 }
        }
    };

    return (
        <motion.div
            className="flex items-center bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden h-12"
            variants={containerVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Expanded Options */}
            <div className="flex items-center pl-2">
                <AnimatePresence>
                    {isOpen && languages.map((lang) => (
                        <motion.button
                            key={lang.code}
                            variants={itemVariants}
                            onClick={() => changeLanguage(lang.code)}
                            className={twMerge(
                                "flex items-center justify-center w-10 h-10 rounded-full mx-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700",
                                currentLang === lang.code ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800" : "text-slate-600 dark:text-slate-400"
                            )}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <span className="text-xs uppercase">{lang.code}</span>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* Main Toggle Button */}
            <button
                className="w-12 h-12 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-10 bg-white dark:bg-slate-800 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Globe size={20} strokeWidth={2} />
            </button>
        </motion.div>
    );
};

export default LanguageSwitcher;
