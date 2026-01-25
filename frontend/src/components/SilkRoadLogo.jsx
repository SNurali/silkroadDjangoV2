import React from 'react';
import { twMerge } from 'tailwind-merge';

const SilkRoadLogo = ({ className = "", textSize = "text-3xl" }) => {
    return (
        <div className={twMerge("font-extrabold tracking-tighter flex items-baseline select-none", className)}>
            <span className="text-slate-900 dark:text-white">Silk</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">Road</span>
            <span className="text-indigo-500 ml-0.5 animate-pulse">.</span>
        </div>
    );
};

export default SilkRoadLogo;
