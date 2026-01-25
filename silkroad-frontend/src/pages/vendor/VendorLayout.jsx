import React from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function VendorLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 font-inter transition-colors duration-200">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <VendorSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white pt-24">
                    <div className="container mx-auto px-6 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}
