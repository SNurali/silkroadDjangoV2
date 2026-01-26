import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, Calendar, Clock, CreditCard, User, AlertCircle } from 'lucide-react';
import api, { createBooking } from '../../services/api';
import BookingForm from '../../components/booking/BookingForm'; // Reusing payment logic if possible, or custom

export default function FlightBooking() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [flight, setFlight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        passenger_name: '',
        passenger_passport: '', // Fixed key
        seat_class: 'economy'
    });

    useEffect(() => {
        const fetchFlight = async () => {
            try {
                // We don't have a single flight endpoint yet in the ViewSet (ReadOnlyModelViewSet default provides retrieve though)
                // Let's assume /api/flights/search/{id}/ works if using standard ViewSet, 
                // BUT FlightViewSet was ReadOnlyModelViewSet on 'search' path.
                // Standard router usually maps retrieve to /search/{id}/.
                const res = await api.get(`/flights/search/${id}/`);
                setFlight(res.data);
            } catch (err) {
                console.error("Failed to load flight", err);
                setError("Flight not found");
            } finally {
                setLoading(false);
            }
        };
        fetchFlight();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Booking
            const booking = await createBooking({
                flight: flight.id,
                ...formData
            });

            // 2. Process Payment (Fake/Test Mode)
            try {
                await api.post(`/flights/bookings/${booking.id}/pay/`);
                alert("Booking and Payment Successful!");
            } catch (payErr) {
                console.error("Payment failed", payErr);
                alert("Booking created but payment failed. Please pay from your profile.");
            }

            navigate('/profile/bookings');
        } catch (err) {
            console.error(err);
            alert("Booking Failed: " + (err.response?.data?.detail || "Unknown error"));
        }
    };

    if (loading) return <div className="min-h-screen pt-20 text-center">Loading...</div>;
    if (error) return <div className="min-h-screen pt-20 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 transition-colors duration-200">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">{t('flights.complete_booking')}</h1>

                <div className="grid gap-6">
                    {/* Flight Summary Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Plane className="text-indigo-500" />
                            {t('flights.flight_details')}
                        </h2>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                            <div className="text-center md:text-left">
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 font-medium">{flight.origin.code}</div>
                            </div>

                            <div className="flex-1 px-4 text-center">
                                <div className="text-xs text-slate-400 mb-1">{flight.flight_number}</div>
                                <div className="h-[2px] bg-indigo-200 dark:bg-indigo-900 relative">
                                    <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 rotate-90 bg-slate-50 dark:bg-slate-900 px-1" />
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{flight.airline.name}</div>
                            </div>

                            <div className="text-center md:text-right">
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 font-medium">{flight.destination.code}</div>
                            </div>
                        </div>
                    </div>

                    {/* Passenger Details Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <User className="text-indigo-500" />
                            {t('flights.passenger_details')}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('flights.full_name')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.passenger_name}
                                        onChange={e => setFormData({ ...formData, passenger_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('flights.passport')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.passenger_passport}
                                        onChange={e => setFormData({ ...formData, passenger_passport: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('flights.seat_class')}
                                </label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.seat_class}
                                    onChange={e => setFormData({ ...formData, seat_class: e.target.value })}
                                >
                                    <option value="economy">Economy (${parseInt(flight.price_economy)})</option>
                                    <option value="business">Business (${parseInt(flight.price_business)})</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <CreditCard size={20} />
                                {t('flights.confirm_pay')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
