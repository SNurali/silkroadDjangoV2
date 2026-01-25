import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, X, MapPin } from 'lucide-react';
import api from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import toast from 'react-hot-toast';

export default function VendorHotelCreate() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // References for regions (fetched from API)
    const [regions, setRegions] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        stars: '3',
        region_id: '',
        address: '',
        geolocation: '', // lat,lng
        description: '',
        deposit: '', // Price/Night
        deposit_turizm: '0',
        images: [], // array of URLs
        amenities_services: {} // { wifi: true, pool: true }
    });

    useEffect(() => {
        fetchReferences();
        if (isEditMode) {
            fetchHotelDetails();
        }
    }, [id]);

    const fetchReferences = async () => {
        try {
            const res = await api.get('/locations/regions/');
            setRegions(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load regions");
        }
    };

    const fetchHotelDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/vendors/hotels/${id}/`);
            const hotel = res.data;

            setFormData({
                name: hotel.name,
                stars: hotel.stars,
                region_id: hotel.region_id || (hotel.region ? hotel.region.id : ''),
                address: hotel.address,
                geolocation: hotel.geolocation,
                description: hotel.description,
                deposit: hotel.deposit,
                deposit_turizm: hotel.deposit_turizm,
                images: hotel.images_read || [], // Use images_read for display
                amenities_services: hotel.amenities_services || {}
            });
        } catch (err) {
            console.error("Failed to load hotel", err);
            toast.error("Failed to load hotel details");
            navigate('/vendor/hotels');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmenityChange = (key, checked) => {
        setFormData(prev => ({
            ...prev,
            amenities_services: { ...prev.amenities_services, [key]: checked }
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

        // Sanitize payload
        const payload = {
            ...formData,
            stars: parseInt(formData.stars) || 3,
            deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
            deposit_turizm: formData.deposit_turizm ? parseFloat(formData.deposit_turizm) : 0,
            // Ensure region_id is sent if it exists, otherwise it might fail validation if empty string
            region_id: formData.region_id ? parseInt(formData.region_id) : null,
        };

        console.log("Submitting Hotel Payload:", payload);

        try {
            if (isEditMode) {
                await api.put(`/vendors/hotels/${id}/`, payload);
                toast.success("Hotel updated successfully!");
            } else {
                await api.post('/vendors/hotels/', payload);
                toast.success("Hotel created successfully!");
            }
            navigate('/vendor/hotels');
        } catch (err) {
            console.error("Hotel Creation Error:", err);
            if (err.response?.data) {
                console.error("Validation Errors:", err.response.data);

                // Show first error toast
                const firstError = Object.values(err.response.data)[0];
                const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                toast.error(`Error: ${errorMessage}`);
            } else {
                toast.error("Failed to create hotel. Check console.");
            }
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const AMENITIES_LIST = [
        { key: 'wifi', label: 'Free WiFi' },
        { key: 'pool', label: 'Swimming Pool' },
        { key: 'gym', label: 'Gym / Fitness' },
        { key: 'spa', label: 'Spa & Wellness' },
        { key: 'restaurant', label: 'Restaurant' },
        { key: 'parking', label: 'Parking' },
        { key: 'bar', label: 'Bar / Lounge' },
        { key: 'ac', label: 'Air Conditioning' },
    ];

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_hotel_create.step_1', 'Basic Info')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.name', 'Hotel Name')} *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required placeholder={t('vendor_hotel_create.name_placeholder', 'e.g. Silk Road Hotel')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.stars', 'Stars')} *</label>
                        <select name="stars" value={formData.stars} onChange={handleChange} className="form-select w-full rounded-lg border-slate-200">
                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.region', 'Region')} *</label>
                        <select name="region_id" value={formData.region_id} onChange={handleChange} className="form-select w-full rounded-lg border-slate-200" required>
                            <option value="">{t('vendor_hotel_create.select_region', 'Select Region')}</option>
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.address', 'Address')} *</label>
                        <input name="address" value={formData.address} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required placeholder={t('vendor_hotel_create.address_placeholder')} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.geolocation', 'Geolocation')} *</label>
                        <LocationPicker
                            value={formData.geolocation}
                            onChange={(val) => setFormData(prev => ({ ...prev, geolocation: val }))}
                        />
                        <p className="text-xs text-slate-500 mt-1">{t('vendor_hotel_create.geo_tip', 'Click map to select')}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={nextStep} className="btn-primary">{t('vendor_create.next_step', 'Next Step')}</button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_hotel_create.step_2', 'Details & Pricing')}</h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.description', 'Description')} *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="form-textarea w-full rounded-lg border-slate-200" required placeholder={t('vendor_hotel_create.desc_placeholder')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.deposit', 'Price per Night (UZS)')} *</label>
                        <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('vendor_hotel_create.deposit_turizm', 'Agnecy Fee / Tax (UZS)')}</label>
                        <input type="number" name="deposit_turizm" value={formData.deposit_turizm} onChange={handleChange} className="form-input w-full rounded-lg border-slate-200" />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('vendor_hotel_create.images', 'Images')}</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm text-slate-600 font-medium">{t('vendor_hotel_create.upload_text', 'Upload Images')}</p>
                        <p className="text-xs text-slate-400">{t('vendor_hotel_create.upload_hint')}</p>
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
            </div>
            <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">{t('vendor_create.prev_step', 'Previous')}</button>
                <button type="button" onClick={nextStep} className="btn-primary">{t('vendor_create.next_step', 'Next Step')}</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{t('vendor_hotel_create.amenities', 'Amenities')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {AMENITIES_LIST.map(amenity => (
                        <label key={amenity.key} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.amenities_services[amenity.key] ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input
                                type="checkbox"
                                checked={!!formData.amenities_services[amenity.key]}
                                onChange={(e) => handleAmenityChange(amenity.key, e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium">{t(`vendor_hotel_create.${amenity.key}`, amenity.label)}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">{t('vendor_create.prev_step', 'Previous')}</button>
                <button type="submit" onClick={handleSubmit} disabled={loading} className="btn-primary bg-green-600 hover:bg-green-700 border-green-600">
                    {loading ? t('vendor_hotel_create.processing', 'Processing...') : (isEditMode ? t('vendor_hotel_create.update', 'Update Hotel') : t('vendor_hotel_create.create', 'Create Hotel'))}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? t('vendor_hotel_create.edit_title', 'Edit Hotel') : t('vendor_hotel_create.title', 'Add New Hotel')}</h1>
                <p className="text-slate-500">{t('vendor_hotel_create.subtitle', 'Manage your hotel listing')}</p>
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
        </div>
    );
}
