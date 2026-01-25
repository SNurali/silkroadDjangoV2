import React from 'react';

const ProfileSection = ({ title, description, children, footer }) => {
    return (
        <div className="mb-12">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2 uppercase tracking-wide">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic max-w-2xl">
                    {description}
                </p>
            </div>

            <div className="shadow-2xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="px-4 py-8 bg-white dark:bg-slate-800 sm:p-8 space-y-8">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end px-4 py-4 bg-slate-50 dark:bg-slate-900/50 text-right sm:px-8 border-t border-slate-50 dark:border-slate-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSection;
