import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building, Map, CalendarCheck, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VendorSidebar() {
    const { t } = useTranslation();
    const { user, hasRole } = useAuth();

    const allNavItems = [
        { path: '/vendor/dashboard', icon: LayoutDashboard, label: t('vendor_sidebar.dashboard'), roles: ['admin', 'vendor', 'vendor_op', 'hotel_admin'] },
        { path: '/vendor/hotels', icon: Building, label: t('vendor_sidebar.my_hotels'), roles: ['admin', 'vendor', 'hotel_admin'] },
        { path: '/vendor/tours', icon: Map, label: t('vendor_sidebar.my_tours'), roles: ['admin', 'vendor', 'vendor_op'] },
        { path: '/vendor/bookings', icon: CalendarCheck, label: t('vendor_sidebar.bookings'), roles: ['admin', 'vendor', 'vendor_op', 'hotel_admin'] },
        { path: '/vendor/settings', icon: Settings, label: t('vendor_sidebar.settings'), roles: ['admin', 'vendor'] },
    ];

    const navItems = allNavItems.filter(item => !item.roles || hasRole(item.roles));

    return (
        <div className="w-64 bg-[#0f172a] min-h-screen text-white flex flex-col border-r border-[#1e293b] pt-24">
            <div className="p-6">
                <h2 className="text-xl font-bold text-blue-400">
                    {t('vendor_sidebar.title')}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{t('vendor_sidebar.subtitle')}</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm
                            ${isActive
                                ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'}
                        `}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-[#1e293b]">
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors text-sm font-medium">
                    <LogOut size={20} />
                    <span>{t('vendor_sidebar.signout')}</span>
                </button>
            </div>
        </div>
    );
}
