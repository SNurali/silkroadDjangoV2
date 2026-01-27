import React from 'react';
import { Hammer, Globe, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Maintenance = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-block">
                    <div className="w-32 h-32 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-50 dark:ring-indigo-900/20">
                        <Hammer className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none">
                        {t('maintenance.title', 'System Maintenance')}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
                        {t('maintenance.desc', "We're currently updating SilkRoad to provide you with a better experience. We'll be back online in a few minutes.")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <Globe className="w-6 h-6 text-blue-500 mx-auto mb-3" />
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1 dark:text-white">Global Sync</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Enterprise V2</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <Clock className="w-6 h-6 text-amber-500 mx-auto mb-3" />
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1 dark:text-white">Est. Time</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">15 Minutes</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <Hammer className="w-6 h-6 text-indigo-500 mx-auto mb-3" />
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1 dark:text-white">Core Update</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">e-mehmon v1.2</p>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-xl active:scale-95"
                    >
                        Check System Status
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
