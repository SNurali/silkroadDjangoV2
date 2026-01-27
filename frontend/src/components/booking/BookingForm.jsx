
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MdClose, MdPerson, MdCalendarToday, MdPublic, MdEmail, MdPhone, MdPeople, MdPayment, MdArrowForward, MdLock, MdHotel, MdSearch } from 'react-icons/md';
import { CheckCircle, Wifi, Tv, Snowflake, Wind } from 'lucide-react';
import api from '../../services/api';
import { createHotelBooking, checkPersonInfo, getCountries, registerPayment, confirmPayment } from '../../services/api';
import toast from 'react-hot-toast';

const BookingForm = ({ isOpen, onClose, hotel, user, preSelectedRooms = {}, initialSearchParams = null }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1); // 1: Search Rooms, 2: Select Rooms, 3: Guest Info, 4: Payment, 5: SMS
    const [countries, setCountries] = useState([]);
    const [isCheckingPerson, setIsCheckingPerson] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Room Search State
    const [searchingRooms, setSearchingRooms] = useState(false);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState({}); // {roomTypeId: quantity}
    const [searchParams, setSearchParams] = useState(null);

    // Payment State
    const [verifyId, setVerifyId] = useState(null);
    const [bookingId, setBookingId] = useState(null);

    const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            check_in: initialSearchParams?.check_in || '',
            check_out: initialSearchParams?.check_out || '',
            adults: initialSearchParams?.adults || 1,
            children: initialSearchParams?.children || 0,
            rooms: initialSearchParams?.rooms || 1,
            passport: '',
            birthday: '',
            citizen: 173,
            guest_name: user?.name || '',
            guest_email: user?.email || '',
            guest_phone: '',
            special_requests: '',
            card_number: '',
            exp_month: '',
            exp_year: '',
            sms_code: '',
            is_foreigner: user?.is_foreigner || false
        }
    });

    // Handle initial state from props
    useEffect(() => {
        if (isOpen) {
            getCountries().then(setCountries);

            if (initialSearchParams) {
                reset({
                    ...initialSearchParams,
                    passport: '',
                    birthday: '',
                    citizen: 173,
                    guest_name: user?.name || '',
                    guest_email: user?.email || '',
                    guest_phone: '',
                    special_requests: '',
                    card_number: '',
                    exp_month: '',
                    exp_year: '',
                    sms_code: ''
                });
                setSearchParams(initialSearchParams);
            }

            if (Object.keys(preSelectedRooms).length > 0) {
                setSelectedRooms(preSelectedRooms);
                // We need to fetch available rooms to have the price data etc.
                const fetchAvailable = async () => {
                    setSearchingRooms(true);
                    try {
                        const response = await api.post(`/hotels/${hotel.id}/search-rooms/`, {
                            check_in: initialSearchParams.check_in,
                            check_out: initialSearchParams.check_out,
                            adults: initialSearchParams.adults,
                            children: initialSearchParams.children,
                            rooms: initialSearchParams.rooms
                        });
                        if (response.data.success) {
                            setAvailableRooms(response.data.rooms);
                            setStep(3); // Jump to Guest Info
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setSearchingRooms(false);
                    }
                };
                fetchAvailable();
            } else {
                setStep(1); // Default to start
            }
        }
    }, [isOpen, initialSearchParams, preSelectedRooms, hotel.id, user, reset]);

    // E-Mehmon Auto-Fill
    const passport = watch('passport');
    const birthday = watch('birthday');
    const citizen = watch('citizen');

    useEffect(() => {
        const checkEmehmon = async () => {
            if (passport?.length > 5 && birthday && citizen) {
                setIsCheckingPerson(true);
                try {
                    const result = await checkPersonInfo({
                        passport,
                        birthday,
                        citizen: parseInt(citizen)
                    });
                    if (result?.psp) {
                        const { surname, firstname, lastname } = result.psp;
                        const fullName = `${surname || ''} ${firstname || ''} ${lastname || ''}`.trim();
                        setValue('guest_name', fullName);
                        toast.success(t('booking.person_found') || `Found: ${fullName}`);
                    }
                } catch (error) {
                    console.error("E-check failed", error);
                } finally {
                    setIsCheckingPerson(false);
                }
            }
        };
        const timeout = setTimeout(checkEmehmon, 1000);
        return () => clearTimeout(timeout);
    }, [passport, birthday, citizen, setValue, t]);

    // Search Rooms API Call
    const onSearchRooms = async (data) => {
        setSearchingRooms(true);
        try {
            const response = await api.post(`/hotels/${hotel.id}/search-rooms/`, {
                check_in: data.check_in,
                check_out: data.check_out,
                adults: parseInt(data.adults),
                children: parseInt(data.children),
                rooms: parseInt(data.rooms)
            });

            if (response.data.success) {
                setAvailableRooms(response.data.rooms);
                setSearchParams(response.data.search_params);
                setStep(2); // Move to room selection
                toast.success(`Found ${response.data.rooms.length} room types available!`);
            } else {
                toast.error('No rooms found for selected dates');
            }
        } catch (error) {
            console.error('Room search failed:', error);
            toast.error('Failed to search rooms. Please try again.');
        } finally {
            setSearchingRooms(false);
        }
    };

    // Handle room selection
    const handleRoomQuantityChange = (roomTypeId, quantity) => {
        setSelectedRooms(prev => {
            const updated = { ...prev };
            if (quantity > 0) {
                updated[roomTypeId] = quantity;
            } else {
                delete updated[roomTypeId];
            }
            return updated;
        });
    };

    // Calculate total price
    const calculateTotalPrice = () => {
        let total = 0;
        Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
            const room = availableRooms.find(r => r.room_type_id === parseInt(roomTypeId));
            if (room) {
                total += room.total_price_usd * quantity;
            }
        });
        return total;
    };
    // Step 3 Submit: Create Booking with selected rooms
    const onSubmitGuestInfo = async (data) => {
        setIsSubmitting(true);
        try {
            // Build selected_rooms_json
            const selected_rooms_array = Object.entries(selectedRooms).map(([roomTypeId, quantity]) => {
                const room = availableRooms.find(r => r.room_type_id === parseInt(roomTypeId));
                return {
                    roomTypeId: parseInt(roomTypeId),
                    roomType: room?.room_type || 'Room',
                    quantity: quantity,
                    price_per_night: room?.price_per_night_usd || 0
                };
            });

            const payload = {
                hotel: hotel.id,
                check_in: searchParams.check_in,
                check_out: searchParams.check_out,
                adults: searchParams.adults,
                children: searchParams.children,
                guest_name: data.guest_name,
                guest_email: data.guest_email,
                guest_phone: data.guest_phone,
                special_requests: data.special_requests,
                total_price: calculateTotalPrice(),
                booking_status: 'pending',
                payment_status: 'pending',
                selected_rooms_json: selected_rooms_array
            };

            const result = await createHotelBooking(payload);
            setBookingId(result.id);

            toast.success("Booking Created! Please make payment.");
            setStep(4); // Move to Payment
        } catch (error) {
            console.error("Booking Failed:", error);
            toast.error(error.response?.data?.error || "Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 4 Submit: Register Card
    const onSubmitPayment = async (data) => {
        setIsSubmitting(true);
        try {
            const res = await registerPayment({
                card_number: data.card_number,
                exp_month: data.exp_month,
                exp_year: data.exp_year,
                phone: data.guest_phone // Use guest phone for SMS? Or allow typing separate phone?
            });

            if (res.data?.verifyId) {
                setVerifyId(res.data.verifyId);
                setStep(5); // Enter SMS
                toast.success("SMS sent to phone!");
            } else {
                toast.error("Card registration failed");
            }
        } catch (error) {
            toast.error("Payment Error: " + (error.response?.data?.message || "Unknown"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 5 Submit: Confirm Payment
    const onSubmitSMS = async (data) => {
        setIsSubmitting(true);
        try {
            await confirmPayment({
                card_token: verifyId,
                card_code: data.sms_code,
                booking_id: bookingId
            });
            toast.success("Payment Successful! Booking Confirmed.");
            onClose();
        } catch (error) {
            toast.error("Invalid SMS Code or Error");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-600">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {step === 1 && <><MdSearch /> Search Rooms</>}
                            {step === 2 && <><MdHotel /> Select Rooms</>}
                            {step === 3 && <><MdPerson /> Guest Details</>}
                            {step === 4 && <><MdPayment /> Payment</>}
                            {step === 5 && <><MdLock /> Verify SMS</>}
                        </h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <MdClose size={24} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        {/* Progress Bar */}
                        <div className="mb-6 flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`h-2 w-12 rounded-full transition-all ${s === step ? 'bg-indigo-600 w-20' : s < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`} />
                            ))}
                        </div>

                        {/* STEP 1: Search Rooms */}
                        {step === 1 && (
                            <form onSubmit={handleSubmit(onSearchRooms)} className="space-y-5">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">When would you like to stay?</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Select dates and guest count</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Check In</label>
                                        <input {...register('check_in', { required: true })} type="date" min={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Check Out</label>
                                        <input {...register('check_out', { required: true })} type="date" min={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Adults</label>
                                        <input {...register('adults', { required: true, min: 1 })} type="number" min="1" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Children</label>
                                        <input {...register('children', { min: 0 })} type="number" min="0" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Rooms</label>
                                        <input {...register('rooms', { required: true, min: 1 })} type="number" min="1" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-center font-bold dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>

                                <button type="submit" disabled={searchingRooms} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transform active:scale-95 transition-all">
                                    <MdSearch size={20} />
                                    {searchingRooms ? 'Searching...' : 'Search Available Rooms'}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: Select Rooms */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Available Rooms</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{searchParams?.nights} night(s), {searchParams?.adults} adult(s)</p>
                                </div>

                                {availableRooms.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No rooms available for selected dates</div>
                                ) : (
                                    availableRooms.map(room => (
                                        <div key={room.room_type_id} className="border dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{room.room_type}</h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Capacity: {room.capacity} guests</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-indigo-600">${room.price_per_night_usd}</p>
                                                    <p className="text-xs text-slate-500">per night</p>
                                                </div>
                                            </div>

                                            {/* Features */}
                                            <div className="flex flex-wrap gap-3 mb-3">
                                                {room.features.wifi && <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300"><Wifi size={14} /> WiFi</span>}
                                                {room.features.aircond && <span className="flex items-center gap-1 text-xs bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-full text-sky-700 dark:text-sky-300"><Wind size={14} /> AC</span>}
                                                {room.features.tvset && <span className="flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300"><Tv size={14} /> TV</span>}
                                                {room.features.freezer && <span className="flex items-center gap-1 text-xs bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-full text-cyan-700 dark:text-cyan-300"><Snowflake size={14} /> Fridge</span>}
                                            </div>

                                            {/* Quantity Selector */}
                                            <div className="flex items-center justify-between border-t dark:border-slate-700 pt-3">
                                                <div>
                                                    <p className="text-xs text-slate-500">{room.available_count} rooms available</p>
                                                    <p className="text-sm font-bold text-green-600">Total: ${room.total_price_usd * (selectedRooms[room.room_type_id] || 0)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRoomQuantityChange(room.room_type_id, (selectedRooms[room.room_type_id] || 0) - 1)}
                                                        className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold disabled:opacity-30"
                                                        disabled={!selectedRooms[room.room_type_id] || selectedRooms[room.room_type_id] === 0}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-lg">{selectedRooms[room.room_type_id] || 0}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRoomQuantityChange(room.room_type_id, (selectedRooms[room.room_type_id] || 0) + 1)}
                                                        className="w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold disabled:opacity-30"
                                                        disabled={(selectedRooms[room.room_type_id] || 0) >= room.available_count}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Total & Continue */}
                                {Object.keys(selectedRooms).length > 0 && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Total Amount:</span>
                                            <span className="text-3xl font-bold text-indigo-600">${calculateTotalPrice().toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => setStep(3)}
                                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Continue to Guest Info <MdArrowForward />
                                        </button>
                                    </div>
                                )}

                                <button onClick={() => setStep(1)} className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm mt-4 hover:underline">
                                    ← Back to Search
                                </button>
                            </div>
                        )}

                        {/* STEP 3: Guest Info */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit(onSubmitGuestInfo)} className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Guest Information</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Who will be staying?</p>
                                </div>

                                <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setValue('is_foreigner', false)}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${!watch('is_foreigner') ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Resident
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('is_foreigner', true)}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${watch('is_foreigner') ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Non-Resident
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <h3 className="text-sm font-bold text-indigo-600 mb-2">Guest Info (E-Mehmon Auto-Fill)</h3>
                                    </div>
                                    <input {...register('passport', { required: true })} placeholder="Passport (AA1234567)" className="w-full p-2 border rounded uppercase dark:bg-slate-700" />
                                    <input {...register('birthday', { required: true })} type="date" className="w-full p-2 border rounded dark:bg-slate-700" />
                                </div>
                                <select {...register('citizen')} className="w-full p-2 border rounded dark:bg-slate-700">
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="relative">
                                    <input {...register('guest_name', { required: true })} placeholder="Full Name" className={`w-full p-2 border rounded dark:bg-slate-700 ${isCheckingPerson ? 'bg-gray-100 animate-pulse' : ''}`} />
                                    {watch('passport')?.length > 5 && (
                                        <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                <CheckCircle size={12} /> E-Mehmon Sync Active
                                            </span>
                                            {isCheckingPerson && <span className="text-[10px] text-slate-400 animate-pulse italic">Checking...</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input {...register('guest_email')} placeholder="Email" type="email" className="w-full p-2 border rounded dark:bg-slate-700" />
                                    <input {...register('guest_phone', { required: true })} placeholder="Phone (998901234567)" className="w-full p-2 border rounded dark:bg-slate-700" />
                                </div>

                                <textarea {...register('special_requests')} placeholder="Special Requests (Optional)" rows="3" className="w-full p-2 border rounded dark:bg-slate-700" />

                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {isSubmitting ? 'Creating Booking...' : 'Proceed to Payment'}
                                </button>
                                <button type="button" onClick={() => setStep(2)} className="w-full text-slate-500 text-sm hover:underline">
                                    ← Back to Room Selection
                                </button>
                            </form>
                        )}

                        {/* STEP 4: Card Payment */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit(onSubmitPayment)} className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount</p>
                                    <p className="text-3xl font-bold text-indigo-600">${calculateTotalPrice().toFixed(2)}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Card Number</label>
                                    <input
                                        {...register('card_number', { required: true, minLength: 16, maxLength: 16 })}
                                        placeholder="8600 0000 0000 0000"
                                        className="w-full p-3 border rounded-lg text-lg tracking-widest dark:bg-slate-700"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Expiry Month</label>
                                        <input {...register('exp_month', { required: true, maxLength: 2 })} placeholder="MM" className="w-full p-3 border rounded-lg text-center dark:bg-slate-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Expiry Year</label>
                                        <input {...register('exp_year', { required: true, maxLength: 2 })} placeholder="YY" className="w-full p-3 border rounded-lg text-center dark:bg-slate-700" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2">
                                    <MdLock /> {isSubmitting ? 'Verifying Card...' : 'Pay Now'}
                                </button>
                                <button type="button" onClick={() => setStep(3)} className="w-full text-gray-500 text-sm hover:underline">Back to Guest Details</button>
                            </form>
                        )}

                        {/* STEP 5: SMS */}
                        {step === 5 && (
                            <form onSubmit={handleSubmit(onSubmitSMS)} className="space-y-6 text-center">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">Enter SMS Code sent to your phone</p>
                                    <input
                                        {...register('sms_code', { required: true })}
                                        placeholder="_ _ _ _"
                                        className="w-1/2 mx-auto p-4 text-center text-3xl tracking-[1em] border rounded-lg dark:bg-slate-700"
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Fake Mode: Enter "1111"</p>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
                                </button>
                            </form>
                        )}

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookingForm;
