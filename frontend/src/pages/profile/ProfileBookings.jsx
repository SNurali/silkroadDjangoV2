import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import ProfileLayout from './ProfileLayout';
import { Building, Map, Plane, Calendar, MapPin, Clock, Search, ExternalLink, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingStatusHistory from '../../components/booking/BookingStatusHistory';

export default function ProfileBookings() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('hotels');
    const [bookings, setBookings] = useState({ hotels: [], tours: [], flights: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const [hotelsRes, toursRes, flightsRes] = await Promise.all([
                    api.get('/hotels/bookings/').catch(err => ({ data: [] })),
                    api.get('/hotels/tickets/').catch(err => ({ data: [] })),
                    api.get('/flights/bookings/').catch(err => ({ data: [] }))
                ]);

                setBookings({
                    hotels: hotelsRes.data.results || hotelsRes.data || [],
                    tours: toursRes.data.results || toursRes.data || [],
                    flights: flightsRes.data.results || flightsRes.data || []
                });
            } catch (err) {
                console.error("Failed to load bookings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const TabButton = ({ id, icon: Icon, label, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
        >
            <Icon size={18} className={activeTab === id ? 'animate-pulse' : ''} />
            <span className="hidden md:inline">{label}</span>
            {count > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {count}
                </span>
            )}
            {activeTab === id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full shadow-[0_-4px_10px_rgba(79,70,229,0.3)]" />
            )}
        </button>
    );

    return (
        <ProfileLayout activePage="bookings">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[600px] transition-all">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 flex">
                    <TabButton id="hotels" icon={Building} label={t('navbar.hotels')} count={bookings.hotels.length} />
                    <TabButton id="tours" icon={Map} label={t('navbar.tours')} count={bookings.tours.length} />
                    <TabButton id="flights" icon={Plane} label={t('navbar.flights')} count={bookings.flights.length} />
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('common.loading', 'Syncing your bookings...')}</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* HOTELS TAB */}
                                {activeTab === 'hotels' && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {bookings.hotels.length === 0 ? (
                                            <EmptyState icon={Building} message={t('profile.no_hotel_bookings', 'No hotel bookings found.')} />
                                        ) : (
                                            bookings.hotels.map(booking => (
                                                <BookingCard key={booking.id} type="hotel">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex gap-6 items-center">
                                                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                                                                <Building size={32} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">
                                                                    {booking.hotel_name || `Hotel #${booking.hotel}`}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar size={14} className="text-indigo-500" />
                                                                        <span>{booking.check_in} — {booking.check_out}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <User size={14} className="text-indigo-500" />
                                                                        <span>{booking.guests_count || 1} {t('home.search_guests')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                                            <StatusBadge status={booking.booking_status} />
                                                            <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                                {(booking.total_price || 0).toLocaleString()} <span className="text-[10px] uppercase font-bold text-slate-400 not-italic">UZS</span>
                                                            </div>
                                                            <a
                                                                href={`/api/hotels/bookings/${booking.id}/download/`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                                            >
                                                                <ExternalLink size={10} />
                                                                Download Voucher
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Expansion for Timeline */}
                                                    <div className="mt-6 border-t border-slate-50 dark:border-slate-800/50">
                                                        <BookingStatusHistory
                                                            status={booking.booking_status}
                                                            syncStatus={booking.emehmon_id}
                                                            type="hotel"
                                                        />
                                                    </div>
                                                </BookingCard>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* TOURS TAB */}
                                {activeTab === 'tours' && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {bookings.tours.length === 0 ? (
                                            <EmptyState icon={Map} message={t('profile.no_tour_bookings', 'No tour tickets found.')} />
                                        ) : (
                                            bookings.tours.map(ticket => (
                                                <BookingCard key={ticket.id} type="tour">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex gap-6 items-center">
                                                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                                                                <Map size={32} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2">
                                                                    {ticket.sight?.name || `Tour Ticket`}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin size={14} className="text-emerald-500" />
                                                                        <span>ID: #{ticket.id}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Building size={14} className="text-emerald-500" />
                                                                        <span>{ticket.total_qty} {t('tours.per_person', 'Tickets')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                                            <StatusBadge status={ticket.is_paid ? 'confirmed' : 'pending'} />
                                                            <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                                {(ticket.total_amount || 0).toLocaleString()} <span className="text-[10px] uppercase font-bold text-slate-400 not-italic">UZS</span>
                                                            </div>
                                                            {ticket.is_paid && (
                                                                <a
                                                                    href={`/api/hotels/tickets/${ticket.id}/download/`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                                                >
                                                                    <ExternalLink size={10} />
                                                                    Download Ticket
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </BookingCard>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* FLIGHTS TAB */}
                                {activeTab === 'flights' && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {bookings.flights.length === 0 ? (
                                            <EmptyState icon={Plane} message={t('profile.no_flight_bookings', 'No flight bookings found.')} />
                                        ) : (
                                            bookings.flights.map(booking => (
                                                <BookingCard key={booking.id} type="flight">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex gap-6 items-center">
                                                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                                                                <Plane size={32} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-2 flex items-center gap-2">
                                                                    <span>{booking.flight?.origin?.code || 'TAS'}</span>
                                                                    <Plane size={14} className="text-blue-500 rotate-90" />
                                                                    <span>{booking.flight?.destination?.code || 'SKD'}</span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar size={14} className="text-blue-500" />
                                                                        {new Date(booking.flight?.departure_time).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock size={14} className="text-blue-500" />
                                                                        {new Date(booking.flight?.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                                            <StatusBadge status={booking.status} />
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">{booking.seat_class}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </BookingCard>
                                            ))
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div >
        </ProfileLayout >
    );
}

const BookingCard = ({ children, type }) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="group relative bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10"
    >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={16} className="text-slate-400" />
        </div>
        {children}
    </motion.div>
);

const EmptyState = ({ message, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
            <Icon size={32} />
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{message}</p>
        <button className="mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic border-b-2 border-indigo-600/20 hover:border-indigo-600 transition-all">
            Start Exploring
        </button>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
        cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200',
        rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200',
        synced: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200',
    };
    const colorClass = colors[status?.toLowerCase()] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200';

    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${colorClass}`}>
            {status}
        </span>
    );
};
