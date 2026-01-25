import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Gallery from '../components/Gallery';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Check, User as UserIcon, Calendar, CreditCard, Flag } from 'lucide-react';
import { clsx } from 'clsx'; // Fixed: Import clsx

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State (Ideally use react-hook-form)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        nationality: '',
        dtb: '',
        gender: 'M',
        passport: '',
        pspissuedt: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || user.first_name || '',
                phone: user.phone || '',
                nationality: user.id_citizen || '',
                dtb: user.dtb || '',
                gender: user.sex || 'M',
                passport: user.passport || '',
                pspissuedt: user.pspissuedt || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/accounts/profile/update/', formData); // Needs backend support
            alert("Profile updated successfully!"); // Toast replacement
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Banner */}
            <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-end mb-8 border border-slate-100/50 backdrop-blur-sm">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200">
                            <img src={user?.avatar || "https://ui-avatars.com/api/?background=random&name=" + (user?.name || "User")}
                                alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md text-slate-600 hover:text-indigo-600 transition-colors">
                            <UserIcon size={16} />
                        </button>
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-slate-800">{user?.name || user?.email}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            Full Stack Developer • {user?.email}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="primary">Edit Profile</Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Personal Info Form */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Personal Info Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <UserIcon size={20} className="text-indigo-500" /> Personal Information
                            </h3>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

                                <Select label="Nationality" value={formData.nationality} placeholder="Select Country"
                                    options={[{ value: 'UZ', label: 'Uzbekistan' }, { value: 'US', label: 'USA' }]}
                                    onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                />

                                <Input label="Date of Birth" type="date" value={formData.dtb} onChange={e => setFormData({ ...formData, dtb: e.target.value })} />

                                {/* Gender Radio */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                                    <div className="flex gap-4">
                                        {['M', 'F'].map((g) => (
                                            <label key={g} className={clsx(
                                                "flex-1 border rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-all",
                                                formData.gender === g ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold" : "border-slate-200 hover:bg-slate-50"
                                            )}>
                                                <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={() => setFormData({ ...formData, gender: g })} className="hidden" />
                                                {g === 'M' ? 'Male' : 'Female'}
                                                {formData.gender === g && <Check size={16} />}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <Input label="Passport Serial" value={formData.passport} onChange={e => setFormData({ ...formData, passport: e.target.value })} />
                                <Input label="Date of Issue" type="date" value={formData.pspissuedt} onChange={e => setFormData({ ...formData, pspissuedt: e.target.value })} />

                                <div className="md:col-span-2 flex justify-end mt-4">
                                    <Button type="submit" isLoading={loading}>Save Changes</Button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Gallery Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100"
                        >
                            <Gallery />
                        </motion.div>
                    </div>

                    {/* Right Column: Sidebar / Progress */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-4">Profile Completion</h4>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                                <div className="bg-green-500 h-full w-[85%] rounded-full"></div>
                            </div>
                            <p className="text-sm text-slate-500">85% Completed. Add your passport details to reach 100%.</p>
                        </div>

                        <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/30 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h4 className="font-bold text-lg mb-2">Upgrade to Pro</h4>
                            <p className="text-indigo-200 text-sm mb-4">Get verified badge and unlimited uploads.</p>
                            <button className="w-full py-2 bg-white text-indigo-900 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition">View Plans</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
