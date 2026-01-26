import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { DollarSign, ShoppingBag, Users, Star, TrendingUp } from 'lucide-react';
import api, { getVendorStats } from '../../services/api';

// ...

export default function VendorDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getVendorStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

    // Charts Configuration
    const areaChartOptions = {
        chart: { type: 'area', height: 350, toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        xaxis: { type: 'datetime', categories: (stats.chartData || []).map(d => d.x) },
        tooltip: { x: { format: 'dd MMM yyyy' } },
        colors: ['#4f46e5'], // Indigo
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100]
            }
        }
    };

    const areaChartSeries = [{ name: 'Earnings', data: (stats.chartData || []).map(d => d.y) }];

    const donutOptions = {
        labels: ['Paid', 'Unpaid', 'Valid', 'Expired'],
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '65%' } } }
    };

    const donutSeries = [
        stats.ticketStatus?.paid || 0,
        stats.ticketStatus?.unpaid || 0,
        stats.ticketStatus?.valid || 0,
        stats.ticketStatus?.expired || 0
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Overview of your business performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={ShoppingBag}
                    label="Total Tickets"
                    value={stats.totalTickets}
                    colorClass="bg-green-500"
                />
                <StatCard
                    icon={DollarSign}
                    label="Total Earnings"
                    value={`$${parseInt(stats.totalEarnings).toLocaleString()}`}
                    colorClass="bg-blue-500"
                />
                <StatCard
                    icon={Users}
                    label="Visitors"
                    value={stats.visitors}
                    colorClass="bg-orange-500"
                />
                <StatCard
                    icon={Star}
                    label="Total Reviews"
                    value={stats.totalReviews}
                    colorClass="bg-purple-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Earnings Statistics</h3>
                    <Chart options={areaChartOptions} series={areaChartSeries} type="area" height={350} />
                </div>

                {/* Donut Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Ticket Status</h3>
                    <Chart options={donutOptions} series={donutSeries} type="donut" height={350} />
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Orders</h3>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Booked By</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(stats.recentBookings || []).length > 0 ? (
                                (stats.recentBookings || []).map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{booking.id}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{booking.user}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">${parseInt(booking.amount).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(booking.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.is_paid
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {booking.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No recent bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

