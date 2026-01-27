import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Upload, MapPin, DollarSign, Clock, FileText, CheckCircle, X, Plus } from 'lucide-react';
import api from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import toast from 'react-hot-toast';

export default function VendorTourCreate() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [references, setReferences] = useState({
        categories: [], regions: [], extra_services: [], required_conditions: []
    });
    const [districts, setDistricts] = useState([]);
    const [newServiceInput, setNewServiceInput] = useState('');
    const [newConditionInput, setNewConditionInput] = useState('');

    // Category Creation State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1
        category_id: '',
        name: '',
        region_id: '',
        district_id: '',
        address: '',
        geolocation: '', // lat,lng
        images: [], // array of URLs

        // Step 2
        extra_services: {}, // { "Service Name": true }
        description: '',
        is_local: '',
        is_weekend_local: '',
        is_foreg: '',
        is_weekend_foreg: '',
        max_capacity: '',
        enable_tickets: '1',

        // Step 3
        required_conditions: {}, // { "Condition": true }
        valid_days: '30',
        policy: '',
        cancelled_options: 'refundable',
        cancel_charges: '0',
        opening_times: {}, // complex object, defaulting to empty or all open
        open_all_days: false,
        weekdays: {
            1: { enabled: true, open: '08:00', close: '21:00' },
            2: { enabled: true, open: '08:00', close: '21:00' },
            3: { enabled: true, open: '08:00', close: '21:00' },
            4: { enabled: true, open: '08:00', close: '21:00' },
            5: { enabled: true, open: '08:00', close: '21:00' },
            6: { enabled: true, open: '08:00', close: '21:00' },
            7: { enabled: true, open: '08:00', close: '21:00' },
        }
    });

    useEffect(() => {
        fetchReferences();
        if (isEditMode) {
            fetchTourDetails();
        }
    }, [id]);

    const fetchReferences = async () => {
        try {
            const res = await api.get('/vendors/references/');
            setReferences(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load form data");
        }
    };

    const fetchTourDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/vendors/tours/${id}/`);
            const tour = res.data;

            // Parse images safely
            let images = [];
            if (Array.isArray(tour.images)) images = tour.images;
            else if (typeof tour.images === 'string') {
                try { images = JSON.parse(tour.images); } catch (e) { images = tour.images.split(',').filter(Boolean); }
            }

            // Parse JSON fields that might be strings
            let extra_services = tour.extra_services;
            if (typeof extra_services === 'string') {
                try { extra_services = JSON.parse(extra_services); } catch (e) { }
            }
            // Actually, if it comes from DRF JSONField it should be object. 
            // If legacy data, might be boolean dict.
            // We need to ensure it's in format { "Name": true }

            let required_conditions = tour.required_conditions;
            if (typeof required_conditions === 'string') {
                try { required_conditions = JSON.parse(required_conditions); } catch (e) { }
            }

            setFormData(prev => ({
                ...prev,
                ...tour,
                images: images || [],
                extra_services: extra_services || {},
                required_conditions: required_conditions || {},
                // handle other fields mapping if necessary
            }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to load tour details");
            navigate('/vendor/tours');
        } finally {
            setLoading(false);
        }
    };


    // Handle Region Change to filter Districts (AJAX)
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!formData.region_id) {
                setDistricts([]);
                return;
            }
            try {
                const res = await api.get(`/locations/districts/?region_id=${formData.region_id}`);
                setDistricts(res.data);
            } catch (err) {
                console.error("Failed to load districts", err);
                // toast.error("Failed to load districts"); // Silencing to avoid spam on initial load
            }
        };
        fetchDistricts();
    }, [formData.region_id]);

    const handleCategoryChange = (e) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsCategoryModalOpen(true);
        } else {
            setFormData(prev => ({ ...prev, category_id: val }));
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setCreatingCategory(true);
        try {
            const res = await api.post('/vendors/categories/', { name: newCategoryName });
            const newCat = res.data;
            setReferences(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
            setFormData(prev => ({ ...prev, category_id: newCat.id }));
            setIsCategoryModalOpen(false);
            setNewCategoryName('');
            toast.success("Category created!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to create category");
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleCheckboxGroup = (group, key, checked) => {
        setFormData(prev => ({
            ...prev,
            [group]: { ...prev[group], [key]: checked }
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const uploadPromises = files.map(file => {
            const data = new FormData();
            data.append('image', file);
            return api.post('/vendors/upload-image/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        });

        try {
            setLoading(true);
            const responses = await Promise.all(uploadPromises);
            const urls = responses.map(res => res.data.imageUrl);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
            toast.success(`${urls.length} images uploaded`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload images");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Prepare data for submission
        console.log("Submitting formData:", formData);

        try {
            if (isEditMode) {
                await api.put(`/vendors/tours/${id}/`, formData);
                toast.success("Tour updated successfully!");
            } else {
                await api.post('/vendors/tours/', formData);
                toast.success("Tour created successfully!");
            }
            navigate('/vendor/tours');
        } catch (err) {
            console.error("Submit Error:", err.response?.data || err);
            toast.error(isEditMode ? "Failed to update tour." : "Failed to create tour. Check fields.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_create.step_1')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.tour_name')} *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required placeholder={t('vendor_create.tour_name_placeholder')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.category')} *</label>
                        <select name="category_id" value={formData.category_id} onChange={handleCategoryChange} className="form-select w-full rounded-lg border-slate-200" required>
                            <option value="">{t('vendor_create.select_category')}</option>
                            {references.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="new" className="font-bold text-indigo-600">{t('vendor_create.add_new_category')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_create.location')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.region')} *</label>
                        <select name="region_id" value={formData.region_id} onChange={handleChange} className="form-select w-full rounded-lg border-slate-200" required>
                            <option value="">{t('vendor_create.select_region')}</option>
                            {references.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.district')} *</label>
                        <select name="district_id" value={formData.district_id} onChange={handleChange} className="form-select w-full rounded-lg border-slate-200" required disabled={!formData.region_id}>
                            <option value="">{t('vendor_create.select_district')}</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.address')} *</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required placeholder={t('vendor_create.address_placeholder')} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.geolocation')} *</label>
                        <LocationPicker
                            value={formData.geolocation}
                            onChange={(val) => setFormData(prev => ({ ...prev, geolocation: val }))}
                        />
                        <p className="text-xs text-slate-500 mt-1">{t('vendor_create.geo_tip')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_create.images')}</h3>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-sm text-slate-600 font-medium">{t('vendor_create.upload_text')}</p>
                    <p className="text-xs text-slate-400">{t('vendor_create.upload_hint')}</p>
                </div>
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden h-24 bg-slate-100 border border-slate-200">
                                <img src={img} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button type="button" onClick={nextStep} className="btn-primary">{t('vendor_create.next_step')}</button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_create.detailed_info')}</h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('vendor_create.extra_services')}</label>

                    {/* Active Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.keys(formData.extra_services).filter(k => formData.extra_services[k]).map(service => (
                            <div key={service} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium animate-fade-in">
                                <span>{service}</span>
                                <button type="button" onClick={() => handleCheckboxGroup('extra_services', service, false)} className="hover:text-indigo-900 bg-indigo-200 rounded-full p-0.5 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Input and Suggestions */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex gap-2 mb-4">
                            <input
                                value={newServiceInput}
                                onChange={(e) => setNewServiceInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newServiceInput.trim()) {
                                            handleCheckboxGroup('extra_services', newServiceInput.trim(), true);
                                            setNewServiceInput('');
                                        }
                                    }
                                }}
                                className="form-input flex-1 rounded-lg border-slate-200"
                                placeholder={t('vendor_create.add_service_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newServiceInput.trim()) {
                                        handleCheckboxGroup('extra_services', newServiceInput.trim(), true);
                                        setNewServiceInput('');
                                    }
                                }}
                                disabled={!newServiceInput.trim()}
                                className="btn-primary px-3 py-2"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Suggestions */}
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('vendor_create.suggestions')}</p>
                            <div className="flex flex-wrap gap-2">
                                {references.extra_services.filter(s => !formData.extra_services[s.name]).map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleCheckboxGroup('extra_services', s.name, true)}
                                        className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:border-indigo-500 hover:text-indigo-600 hover:bg-white transition-all bg-white dark:bg-slate-800"
                                    >
                                        + {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.description')} *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="form-textarea w-full rounded-lg border-slate-200" required placeholder={t('vendor_create.desc_placeholder')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.local_price')} *</label>
                        <input
                            type="number"
                            name="is_local"
                            value={formData.is_local}
                            onChange={handleChange}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (!val || val < 1000) val = 1000;
                                if (val > 50000000) val = 50000000;
                                setFormData(prev => ({ ...prev, is_local: val }));
                            }}
                            min="1000"
                            max="50000000"
                            className="form-input w-full rounded-lg border-slate-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.foreg_price')} *</label>
                        <input
                            type="number"
                            name="is_foreg"
                            value={formData.is_foreg}
                            onChange={handleChange}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (!val || val < 3000) val = 3000;
                                if (val > 50000000) val = 50000000;
                                setFormData(prev => ({ ...prev, is_foreg: val }));
                            }}
                            min="3000"
                            max="50000000"
                            className="form-input w-full rounded-lg border-slate-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.weekend_local_price')}</label>
                        <input
                            type="number"
                            name="is_weekend_local"
                            value={formData.is_weekend_local}
                            onChange={handleChange}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (!val || val < 1000) val = 0;
                                setFormData(prev => ({ ...prev, is_weekend_local: val }));
                            }}
                            className="form-input w-full rounded-lg border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.weekend_foreg_price')}</label>
                        <input
                            type="number"
                            name="is_weekend_foreg"
                            value={formData.is_weekend_foreg}
                            onChange={handleChange}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (!val || val < 3000) val = 0;
                                setFormData(prev => ({ ...prev, is_weekend_foreg: val }));
                            }}
                            className="form-input w-full rounded-lg border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.max_capacity')} *</label>
                        <input
                            type="number"
                            name="max_capacity"
                            value={formData.max_capacity}
                            onChange={handleChange}
                            onBlur={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (!val || val < 1) val = 1;
                                if (val > 30) val = 30;
                                setFormData(prev => ({ ...prev, max_capacity: val }));
                            }}
                            min="1"
                            max="30"
                            className="form-input w-full rounded-lg border-slate-200"
                            required
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.enable_tickets')}</label>
                    <select name="enable_tickets" value={formData.enable_tickets} onChange={handleChange} className="form-select w-full md:w-1/3 rounded-lg border-slate-200">
                        <option value="1">{t('vendor_create.enable')}</option>
                        <option value="0">{t('vendor_create.disable')}</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">{t('vendor_create.prev_step')}</button>
                <button type="button" onClick={nextStep} className="btn-primary">{t('vendor_create.next_step')}</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_create.policy_conditions')}</h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('vendor_create.required_conditions')}</label>

                    {/* Active Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.keys(formData.required_conditions).filter(k => formData.required_conditions[k]).map(cond => (
                            <div key={cond} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium animate-fade-in">
                                <span>{cond}</span>
                                <button type="button" onClick={() => handleCheckboxGroup('required_conditions', cond, false)} className="hover:text-orange-900 bg-orange-200 rounded-full p-0.5 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Input and Suggestions */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex gap-2 mb-4">
                            <input
                                value={newConditionInput}
                                onChange={(e) => setNewConditionInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newConditionInput.trim()) {
                                            handleCheckboxGroup('required_conditions', newConditionInput.trim(), true);
                                            setNewConditionInput('');
                                        }
                                    }
                                }}
                                className="form-input flex-1 rounded-lg border-slate-200"
                                placeholder={t('vendor_create.add_condition_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newConditionInput.trim()) {
                                        handleCheckboxGroup('required_conditions', newConditionInput.trim(), true);
                                        setNewConditionInput('');
                                    }
                                }}
                                disabled={!newConditionInput.trim()}
                                className="btn-primary px-3 py-2 bg-orange-600 hover:bg-orange-700 border-orange-600"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Suggestions */}
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('vendor_create.suggestions')}</p>
                            <div className="flex flex-wrap gap-2">
                                {references.required_conditions.filter(c => !formData.required_conditions[c.name]).map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleCheckboxGroup('required_conditions', c.name, true)}
                                        className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:border-orange-500 hover:text-orange-600 hover:bg-white transition-all bg-white dark:bg-slate-800"
                                    >
                                        + {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.validity')}</label>
                        <input type="number" name="valid_days" value={formData.valid_days} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.cancellation')}</label>
                        <select name="cancelled_options" value={formData.cancelled_options} onChange={handleChange} className="form-select w-full rounded-lg border-slate-200">
                            <option value="refundable">{t('vendor_create.refundable')}</option>
                            <option value="non_refundable">{t('vendor_create.non_refundable')}</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.policy_rules')} *</label>
                    <textarea name="policy" value={formData.policy} onChange={handleChange} rows={4} className="form-textarea w-full rounded-lg border-slate-200" required placeholder={t('vendor_create.policy_placeholder')} />
                </div>
            </div>

            <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">{t('vendor_create.prev_step')}</button>
                <button type="submit" onClick={handleSubmit} disabled={loading} className="btn-primary bg-green-600 hover:bg-green-700 border-green-600">
                    {loading ? (isEditMode ? t('vendor_create.updating') : t('vendor_create.creating')) : (isEditMode ? t('vendor_create.update_tour') : t('vendor_create.create_tour'))}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? t('vendor_create.edit_title') : t('vendor_create.title')}</h1>
                <p className="text-slate-500">{t('vendor_create.subtitle')}</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-colors ${step >= i ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                            {i}
                        </div>
                        {i < 3 && <div className={`h-1 flex-1 mx-4 rounded ${step > i ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>}
                    </div>
                ))}
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </form>

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('vendor_create.new_category_modal_title')}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_create.category_name')}</label>
                            <input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="form-input w-full"
                                placeholder={t('vendor_create.category_name')}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                {t('vendor_create.cancel')}
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                disabled={creatingCategory || !newCategoryName.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {creatingCategory ? t('vendor_create.creating') : t('vendor_create.create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

