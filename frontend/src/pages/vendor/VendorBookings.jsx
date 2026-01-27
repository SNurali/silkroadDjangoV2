import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function VendorBookings() {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const [hotelRes, ticketRes] = await Promise.all([
                api.get('/vendors/bookings/'),
                api.get('/vendors/tickets/')
            ]);

            const hotelBookings = (hotelRes.data.results || hotelRes.data).map(b => ({
                ...b,
                type: 'hotel',
                // Normalizing
                unique_id: `H-${b.id}`,
                real_id: b.id,
                item_name: typeof b.hotel === 'object' ? b.hotel.name : 'Hotel Booking',
                display_date: b.created_at,
                amount: b.total_price,
                check_in_display: `${b.check_in} to ${b.check_out}`
            }));

            const ticketBookings = (ticketRes.data.results || ticketRes.data).map(t => ({
                ...t,
                type: 'tour',
                // Normalizing
                unique_id: `T-${t.id}`,
                real_id: t.id,
                item_name: t.sight ? t.sight.name : 'Tour',
                display_date: t.created_at,
                amount: t.total_amount,
                guest_name: t.created_by_name || 'Guest', // Assuming serializer provides this or need update
                // Ticket has no check-in range usually
                check_in_display: new Date(t.created_at).toLocaleDateString()
            }));

            // Merge and Sort
            const merged = [...hotelBookings, ...ticketBookings].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            setBookings(merged);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [rejectionModal, setRejectionModal] = useState({ open: false, item: null, reason: '' });

    const handleAction = async (item, action, reason = null) => {
        if (action === 'reject' && !reason) {
            // Open Modal
            setRejectionModal({ open: true, item: item, reason: '' });
            return;
        }

        if (action === 'approve' && !window.confirm(t('vendor_bookings.approve_confirm'))) return;

        const endpoint = item.type === 'tour'
            ? `/vendors/tickets/${item.real_id}/${action}/`
            : `/vendors/bookings/${item.real_id}/${action}/`;

        try {
            const payload = reason ? { reason } : {};
            await api.post(endpoint, payload);

            // Optimistic update
            setBookings(prev => prev.map(b => {
                if (b.unique_id === item.unique_id) {
                    return { ...b, booking_status: action === 'approve' ? 'confirmed' : 'cancelled' };
                }
                return b;
            }));

            // Close modal if open
            if (rejectionModal.open) setRejectionModal({ open: false, item: null, reason: '' });

            alert(t('vendor_bookings.success_msg', { action: action }));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || t('vendor_bookings.error_msg', { action: action }));
        }
    };

    const submitRejection = () => {
        if (!rejectionModal.reason.trim()) return alert(t('vendor_bookings.enter_reason'));
        handleAction(rejectionModal.item, 'reject', rejectionModal.reason);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Filter
    const filteredBookings = filterStatus === 'All'
        ? bookings
        : bookings.filter(b => b.booking_status === filterStatus.toLowerCase());

    const filterOptions = [
        { label: t('vendor_bookings.filter_all'), value: 'All' },
        { label: t('vendor_bookings.filter_pending'), value: 'Pending' },
        { label: t('vendor_bookings.filter_confirmed'), value: 'Confirmed' },
        { label: t('vendor_bookings.filter_cancelled'), value: 'Cancelled' }
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('vendor_bookings.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('vendor_bookings.subtitle')}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('vendor_bookings.search_placeholder')}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    {/* Simple Filter Toggle for demo */}
                    <div className="flex gap-2">
                        {filterOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilterStatus(opt.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === opt.value ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">{t('vendor_bookings.table_id')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_guest')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_service')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_type')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_date')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_amount')}</th>
                                <th className="px-6 py-4">{t('vendor_bookings.table_status')}</th>
                                <th className="px-6 py-4 text-right">{t('vendor_bookings.table_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-8">{t('vendor_bookings.loading')}</td></tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8 text-slate-500">{t('vendor_bookings.no_bookings')}</td></tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.unique_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-indigo-600">{booking.unique_id}</td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                                            {booking.guest_name}
                                            <div className="text-xs text-slate-400">{booking.guest_email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {booking.item_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${booking.type === 'hotel' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {booking.type === 'hotel' ? t('vendor_bookings.type_hotel') : t('vendor_bookings.type_tour')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {booking.check_in_display}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            {typeof booking.amount === 'number' ? booking.amount.toLocaleString() : booking.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.booking_status)}`}>
                                                {booking.booking_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            {booking.booking_status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(booking, 'approve')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Confirm"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(booking, 'reject')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('vendor_bookings.reject_title')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                            {t('vendor_bookings.reject_desc')}
                        </p>

                        <textarea
                            value={rejectionModal.reason}
                            onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder={t('vendor_bookings.reject_reason_placeholder')}
                            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
                            autoFocus
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectionModal({ open: false, item: null, reason: '' })}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('vendor_bookings.cancel')}
                            </button>
                            <button
                                onClick={submitRejection}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t('vendor_bookings.reject_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
