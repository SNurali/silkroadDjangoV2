import React from 'react';
import ProfileSidebar from './ProfileSidebar';
import { useTranslation } from 'react-i18next';

const ProfileLayout = ({ children, activePage }) => {
    const { t } = useTranslation();

    const pageTitles = {
        'profile': t('profile.menu.my_profile'),
        'bookings': t('profile.menu.bookings'),
        'travelers': t('profile.menu.travelers'),
        'settings': t('profile.menu.settings'),
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 pt-32 pb-8 mb-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        {pageTitles[activePage] || t('profile.menu.dashboard')}
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        <span>SilkRoad</span>
                        <span>/</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{pageTitles[activePage]}</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <ProfileSidebar active={activePage} />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileLayout;
