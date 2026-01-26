import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ComingSoon = ({ title = "Coming Soon" }) => {
    const { t } = useTranslation();

    const getTitleKey = (title) => {
        if (title.includes('Flights')) return 'coming_soon.flights_title';
        if (title.includes('Tours')) return 'coming_soon.tours_title';
        if (title.includes('Cab')) return 'coming_soon.cabs_title';
        return title; // Fallback
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center px-4 transition-colors duration-200">
            <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl shadow-xl max-w-lg w-full transition-colors">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                    <Construction size={40} />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                    {t(getTitleKey(title), title)}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                    {t('coming_soon.description')}
                </p>
                <Link to="/" className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                    {t('coming_soon.back_home')}
                </Link>
            </div>
        </div>
    );
};

export default ComingSoon;
