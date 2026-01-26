import React from 'react';
import Gallery from '../../components/Gallery';

export default function VendorGalleryPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Photos</h1>
                <p className="text-slate-500 dark:text-slate-400">Upload high-quality images for your vendor profile.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors">
                <Gallery endpoint="/vendors/me/images/" />
            </div>
        </div>
    );
}
