import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Image as ImageIcon, Store, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { registerVendor, getRegions, getCategories } from '../../services/api';
import toast from 'react-hot-toast';

const steps = [
    { id: 1, title: 'Basic Info', icon: Store },
    { id: 2, title: 'Location', icon: MapPin },
    { id: 3, title: 'Photos', icon: ImageIcon },
];

const VendorRegistration = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [regions, setRegions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
    const formData = watch();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [regs, cats] = await Promise.all([getRegions(), getCategories()]);
                setRegions(regs || []);
                setCategories(cats || []);
            } catch (e) {
                console.error("Failed to load options", e);
                toast.error("Failed to load form options");
            }
        };
        loadData();
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = new FormData();
            Object.keys(data).forEach(key => {
                if (key === 'photo' && data.photo[0]) {
                    payload.append('photo', data.photo[0]);
                } else {
                    payload.append(key, data[key]);
                }
            });
            // Default district for now until API supports it
            payload.append('id_district', 1);

            await registerVendor(payload);
            toast.success('Registration Successful!');
            navigate('/vendor/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.join ? error.response.data.join(', ') : 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Become a Vendor</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Join SilkRoad and start selling your services</p>
                </div>

                {/* Steps */}
                <div className="mb-8 flex justify-center items-center gap-4">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                ${currentStep >= step.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}
                            `}>
                                {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-12 h-1 mx-2 ${currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden p-8">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Basic Information</h2>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor Name</label>
                                    <input {...register('name', { required: true })} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="e.g. Silk Road Hotel" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                        <select {...register('id_category', { required: true })} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600">
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region</label>
                                        <select {...register('id_region', { required: true })} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600">
                                            <option value="">Select Region</option>
                                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Location */}
                        {currentStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Location Details</h2>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                    <input {...register('address', { required: true })} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="Full Address" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Geolocation (Lat, Lng)</label>
                                    <input {...register('geo')} className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="e.g. 41.2995, 69.2401" />
                                    <p className="text-xs text-slate-500 mt-1">You can pick from map later (Coming Soon)</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Photos */}
                        {currentStep === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <h2 className="text-xl font-bold mb-4 dark:text-white">Vendor Photo</h2>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                                    <input {...register('photo', { required: true })} type="file" accept="image/*" className="hidden" id="photo-upload" />
                                    <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <ImageIcon size={48} className="text-slate-400" />
                                        <span className="text-indigo-600 font-medium">Click to upload main photo</span>
                                    </label>
                                    {formData.photo && formData.photo[0] && (
                                        <p className="mt-2 text-sm text-green-600">{formData.photo[0].name}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="mt-8 flex justify-between">
                            {currentStep > 1 ? (
                                <button type="button" onClick={prevStep} className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2">
                                    <ArrowLeft size={16} /> Back
                                </button>
                            ) : <div></div>}

                            {currentStep < steps.length ? (
                                <button type="button" onClick={nextStep} className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2">
                                    Next <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button disabled={loading} type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2">
                                    {loading ? 'Submitting...' : 'Complete Registration'} <CheckCircle size={16} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VendorRegistration;
