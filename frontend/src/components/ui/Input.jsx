import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <input
                ref={ref}
                className={twMerge(clsx(
                    "w-full px-4 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200",
                    className
                ))}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
