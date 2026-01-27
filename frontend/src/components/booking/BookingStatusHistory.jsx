import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Plane, Building, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BookingStatusHistory = ({ status, syncStatus, confirmedAt, type = 'hotel' }) => {
    const { t } = useTranslation();

    const steps = [
        {
            id: 'created',
            label: t('booking.status_created', 'Booking Created'),
            description: t('booking.status_created_desc', 'Your booking request has been registered.'),
            icon: Clock,
            isCompleted: true,
            isActive: status === 'pending' && !syncStatus
        },
        {
            id: 'emehmon',
            label: t('booking.status_synced', 'E-Mehmon Synchronized'),
            description: t('booking.status_synced_desc', 'Verified and registered in the state system.'),
            icon: CheckCircle,
            isCompleted: !!syncStatus || status === 'confirmed',
            isActive: !!syncStatus && status !== 'confirmed'
        },
        {
            id: 'confirmed',
            label: t('booking.status_confirmed', 'Hotel Confirmed'),
            description: t('booking.status_confirmed_desc', 'The hotel has confirmed your stay.'),
            icon: Building,
            isCompleted: status === 'confirmed',
            isActive: status === 'confirmed'
        }
    ];

    if (type === 'tour') {
        steps[2] = {
            id: 'confirmed',
            label: t('booking.status_tour_confirmed', 'Ticket Validated'),
            description: t('booking.status_tour_confirmed_desc', 'Your ticket is ready for use.'),
            icon: MapPin,
            isCompleted: status === 'confirmed',
            isActive: status === 'confirmed'
        };
    }

    return (
        <div className="py-6 px-4">
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Clock size={14} /> {t('profile.booking_timeline', 'Booking Timeline')}
            </h5>
            <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700" />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.id} className="relative flex items-start gap-4">
                            <div className={`
                                shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500
                                ${step.isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : step.isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}
                            `}>
                                <Icon size={20} />
                            </div>
                            <div className="pt-0.5">
                                <h6 className={`text-sm font-bold ${step.isCompleted || step.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {step.label}
                                </h6>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BookingStatusHistory;
