import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import api from '../../services/api';
import { DollarSign, ShoppingBag, Map, Building, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function VendorDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/vendors/dashboard/?days=${days}`);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [days]);

    const handleDownloadReport = () => {
        if (!stats) return;
        const headers = ["Date", "User", "Service", "Amount", "Status"];
        const rows = (stats.recent_bookings || []).map(b => [
            new Date(b.date).toLocaleDateString(),
            b.user,
            b.service,
            b.amount,
            b.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${days}days_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !stats) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    // If we have stats but are reloading (changing filter), show overlay or just update seamlessly?
    // Current logic: loading covers everything. Let's make it smarter or keep simple.
    // Keeping simple for now, sticking to logic above.

    // Chart Data from API
    const revenueOptions = {
        chart: { type: 'area', height: 350, toolbar: { show: false } },
        colors: ['#6366f1'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, stops: [0, 90, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: stats?.chart_data?.dates || [] },
        tooltip: { theme: 'dark' },
        grid: { borderColor: '#f1f5f9' }
    };

    const revenueSeries = [{ name: 'Revenue', data: stats?.chart_data?.values || [] }];

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <TrendingUp size={12} />
                        +{trend}%
                    </div>
                )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('vendor_dashboard.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {t('vendor_dashboard.welcome', { name: stats?.name })}
                    </p>
                </div>
                <div className="flex gap-3 relative">
                    {/* Date Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 transition-colors"
                        >
                            <Calendar size={16} />
                            <span>
                                {days === 7 ? t('Last 7 Days') :
                                    days === 30 ? t('Last 30 Days') :
                                        days === 90 ? t('Last 3 Months') :
                                            days === 365 ? t('Last Year') : days + ' Days'}
                            </span>
                        </button>

                        {filterOpen && (
                            <div className="absolute top-full mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl overflow-hidden z-20">
                                {[7, 30, 90, 365].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => { setDays(d); setFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${days === d ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {d === 7 ? 'Last 7 Days' : d === 30 ? 'Last 30 Days' : d === 90 ? 'Last 3 Months' : 'Last Year'}
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Backdrop to close */}
                        {filterOpen && <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)}></div>}
                    </div>

                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                    >
                        <ArrowUpRight size={16} />
                        {t('vendor_dashboard.reports')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('vendor_dashboard.total_revenue')}
                    value={`${parseInt(stats?.balance || 0).toLocaleString()} UZS`}
                    icon={DollarSign}
                    color="bg-emerald-500"
                    trend="12.5"
                />
                <StatCard
                    title={t('vendor_dashboard.total_bookings')}
                    value={stats?.stats?.total_bookings || 0}
                    icon={ShoppingBag}
                    color="bg-indigo-500"
                    trend="8.2"
                />
                <StatCard
                    title={t('vendor_dashboard.active_hotels')}
                    value={stats?.stats?.hotels || 0}
                    icon={Building}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('vendor_dashboard.active_tours')}
                    value={stats?.stats?.tours || 0}
                    icon={Map}
                    color="bg-violet-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('vendor_dashboard.revenue_analytics')}</h3>
                    </div>
                    <Chart options={revenueOptions} series={revenueSeries} type="area" height={350} />
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('vendor_dashboard.recent_bookings')}</h3>
                    <div className="space-y-4">
                        {stats?.recent_bookings?.length > 0 ? (
                            stats.recent_bookings.map((booking) => (
                                <div key={booking.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{booking.user}</p>
                                        <p className="text-xs text-slate-500">{booking.service}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">+{parseFloat(booking.amount).toLocaleString()} UZS</p>
                                        <p className="text-xs text-slate-400">{new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <ShoppingBag size={20} />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('vendor_dashboard.no_bookings')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
