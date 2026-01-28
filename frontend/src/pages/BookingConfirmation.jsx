import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, FileText, Calendar, Users, MapPin, CreditCard, Clock, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function BookingConfirmation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            const res = await api.get(`/hotels/bookings/${id}/`);
            setBooking(res.data);
        } catch (err) {
            console.error('Failed to fetch booking:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const response = await api.get(`/hotels/bookings/${id}/download/`, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download PDF:', err);
            alert(t('booking_conf.alert_fail_download'));
        } finally {
            setDownloading(false);
        }
    };

    const handlePreviewPDF = () => {
        const token = localStorage.getItem('access_token');
        const url = `${api.defaults.baseURL}/hotels/bookings/${id}/preview/?token=${token}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{t('booking_conf.not_found')}</h2>
                    <Link to="/profile/bookings" className="text-blue-600 hover:underline">
                        {t('booking_conf.view_all')}
                    </Link>
                </div>
            </div>
        );
    }

    const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24));

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                        {t('booking_conf.success_title')}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        {t('booking_conf.success_subtitle')}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{t('booking_conf.booking_id')} #{booking.id}</h2>
                                <p className="text-blue-100 text-sm">{t('booking_conf.created_on')} {new Date(booking.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(booking.booking_status)} border-2 border-white`}>
                                    {booking.booking_status.toUpperCase()}
                                </span>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getPaymentStatusColor(booking.payment_status)} border-2 border-white`}>
                                    {booking.payment_status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-8 space-y-8">
                        {/* Hotel Info */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                {t('booking_conf.hotel_info')}
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{booking.hotel_name}</p>
                                <p className="text-slate-600 dark:text-slate-400">{t('booking_conf.address_note')}</p>
                            </div>
                        </div>

                        {/* Stay Details */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    {t('booking_conf.stay_details')}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.check_in')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {new Date(booking.check_in).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.check_out')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {new Date(booking.check_out).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'uz' ? 'uz-UZ' : 'ru-RU'), { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.duration')}:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{nights} {t('booking_conf.nights')}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    {t('booking_conf.guest_details')}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.name')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{booking.guest_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.email')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{booking.guest_email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.phone')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{booking.guest_phone}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-600 dark:text-slate-400">{t('booking_conf.guests')}:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {booking.adults} {t('booking_conf.adults')}, {booking.children} {t('booking_conf.children')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Special Requests */}
                        {booking.special_requests && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t('booking_conf.special_requests')}</h3>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <p className="text-slate-700 dark:text-slate-300">{booking.special_requests}</p>
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                {t('booking_conf.payment_summary')}
                            </h3>
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{t('booking_conf.total_amount')}:</span>
                                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                        ${parseFloat(booking.total_price).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-slate-50 dark:bg-slate-900 px-8 py-6 flex flex-wrap gap-4 justify-between items-center border-t border-slate-200 dark:border-slate-700">
                        <Link
                            to="/profile/bookings"
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('booking_conf.back_to_bookings')}
                        </Link>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePreviewPDF}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-600 shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                {t('booking_conf.preview')}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                {downloading ? t('booking_conf.downloading') : t('booking_conf.download_pdf')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Important Info */}
                <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">{t('booking_conf.important_info')}</h4>
                            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                                <li>• {t('booking_conf.check_in_time')}</li>
                                <li>• {t('booking_conf.bring_id')}</li>
                                <li>• {t('booking_conf.email_sent', { email: booking.guest_email })}</li>
                                <li>• {t('booking_conf.contact_support')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
