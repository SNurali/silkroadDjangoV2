import React from 'react';
import { User, CreditCard, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const ProfileSidebar = ({ active = 'profile' }) => {
    const { logout, user } = useAuth();
    const { t } = useTranslation();

    const menuItems = [
        { id: 'profile', icon: User, label: t('profile.menu.my_profile'), link: '/profile' },
        { id: 'bookings', icon: CreditCard, label: t('profile.menu.bookings'), link: '/profile/bookings' },
        { id: 'travelers', icon: Users, label: t('profile.menu.travelers'), link: '/profile/travelers' },
        { id: 'settings', icon: Settings, label: t('profile.menu.settings'), link: '/profile/settings' },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* User Brief Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                    <img
                        src={user?.avatar_url || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`}
                        alt={user?.name}
                        className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20 object-cover"
                    />
                    <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate italic">{user?.email}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={14} />
                        {t('profile.role_user', 'Verified Account')}
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 transition-all overflow-hidden">
                <div className="flex flex-col gap-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.id}
                            to={item.link}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon size={18} className={clsx(
                                "transition-transform group-hover:scale-110",
                                active === item.id ? "text-white" : "text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                            )} />
                            <span className="text-sm">{item.label}</span>
                            {active === item.id && (
                                <span className="absolute left-0 w-1 h-6 bg-indigo-300 rounded-r-full" />
                            )}
                        </NavLink>
                    ))}

                    <div className="my-2 px-4">
                        <hr className="border-slate-50 dark:border-slate-700" />
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-all text-left group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{t('auth.logout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;
