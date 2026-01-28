import React from 'react';
import { motion } from 'framer-motion';
import {
    Globe, Calendar, User, Camera,
    Mail, CreditCard, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

// Official Palette Matches
const ACTIVE_COLOR = "bg-[#5BC0DE]"; // Cyan/Teal
const COMPLETED_COLOR = "bg-[#1B4A8D]"; // Deep Blue
const INACTIVE_COLOR = "bg-slate-200 dark:bg-slate-700";

const steps = [
    { id: 1, title: 'country', icon: Globe },
    { id: 2, title: 'date', icon: Calendar },
    { id: 3, title: 'personal', icon: User },
    { id: 4, title: 'photo', icon: Camera },
    { id: 5, title: 'activation', icon: Mail },
    { id: 6, title: 'payment', icon: CreditCard },
];

export default function VisaStepper({ currentStep = 1 }) {
    const { t } = useTranslation();

    return (
        <div className="w-full">
            {/* Desktop Stepper */}
            <div className="hidden md:flex justify-between items-center relative">
                {/* Connecting Line Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full" />

                {/* Active Progress Line */}
                <motion.div
                    className="absolute top-1/2 left-0 h-1 bg-[#5BC0DE] -z-0 rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (currentStep - 1) / (steps.length - 1) }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                />

                {steps.map((step, index) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;

                    return (
                        <div key={step.id} className="flex flex-col items-center group cursor-pointer">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={twMerge(
                                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                                    isActive
                                        ? `border-[#5BC0DE] bg-white dark:bg-slate-900 text-[#5BC0DE] shadow-[0_0_0_4px_rgba(91,192,222,0.2)]`
                                        : isCompleted
                                            ? `${COMPLETED_COLOR} border-[#1B4A8D] text-white`
                                            : `${INACTIVE_COLOR} border-transparent text-slate-400`
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <step.icon size={20} />
                                )}
                            </motion.div>

                            <div className={twMerge(
                                "absolute mt-14 text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                                isActive ? "text-[#1B4A8D]" : isCompleted ? "text-[#1B4A8D]" : "text-slate-400"
                            )}>
                                {t(`visa.steps.${step.title}`)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Stepper (Condensed) */}
            <div className="flex md:hidden items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5BC0DE] text-white flex items-center justify-center font-bold">
                        {currentStep}
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">
                            {t('visa.steps.mobile_label', { current: currentStep, total: steps.length })}
                        </p>
                        <p className="text-sm font-bold text-[#1B4A8D]">{t(`visa.steps.${steps[currentStep - 1].title}`)}</p>
                    </div>
                </div>
                {/* Progress Circle */}
                <div className="relative w-10 h-10">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                        <circle
                            cx="20" cy="20" r="18"
                            stroke="#5BC0DE" strokeWidth="4" fill="transparent"
                            strokeDasharray={113}
                            strokeDashoffset={113 - (113 * currentStep) / steps.length}
                            className="transition-all duration-500"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
