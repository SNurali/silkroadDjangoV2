
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MdClose, MdPerson, MdCalendarToday, MdPublic, MdEmail, MdPhone, MdPeople, MdPayment, MdArrowForward, MdLock } from 'react-icons/md';
import { createHotelBooking, checkPersonInfo, getCountries, registerPayment, confirmPayment } from '../../services/api';
import toast from 'react-hot-toast';

const BookingForm = ({ isOpen, onClose, hotel, user }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [countries, setCountries] = useState([]);
    const [isCheckingPerson, setIsCheckingPerson] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment State
    const [verifyId, setVerifyId] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    // Legacy flow: create ticket -> pay ticket.
    // Here we might create booking -> get ID -> pay.

    // We need to coordinate the flow. 
    // Option A: Submit Booking -> Get ID -> Show Payment Modal.
    // Option B: Multi-step inside this modal.
    // Let's do Option B: Step 1 (Info) -> Step 2 (Card) -> Submit Booking & Pay.
    // Actually, backend usually requires Booking object to exist before payment.

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            check_in: '',
            check_out: '',
            adults: 1,
            children: 0,
            passport: '',
            birthday: '',
            citizen: 173,
            guest_name: user?.name || '',
            guest_email: user?.email || '',
            guest_phone: '',
            special_requests: '',
            // Payment Fields
            card_number: '',
            exp_month: '',
            exp_year: '',
            sms_code: ''
        }
    });

    // Load Countries
    useEffect(() => {
        if (isOpen) {
            getCountries().then(setCountries);
        }
    }, [isOpen]);

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


    // Step 1 Submit: Create Booking (Pending) -> Move to Payment
    const onSubmitStep1 = async (data) => {
        setIsSubmitting(true);
        try {
            // Create booking logic (returns ticket/booking ID)
            const payload = {
                hotel: hotel.id,
                ...data,
                total_price: 150000, // Placeholder
                booking_status: 'pending', // Explicit status
                selected_rooms_json: [{ room_id: 1, count: 1 }]
            };

            console.log("Submitting Booking Payload:", payload); // DEBUG

            // For now, we assume booking creation is part of final step or we create it now.
            // Let's create it now to get ID for payment.
            const result = await createHotelBooking(payload);
            console.log("Booking Result:", result); // DEBUG

            setBookingId(result.id); // Assuming result has id

            toast.success("Booking Initiated! Please make payment.");
            setStep(2); // Move to Payment
        } catch (error) {
            console.error("Booking Init Failed:", error);
            if (error.response?.data) {
                console.error("Validation Details:", error.response.data);
                toast.error(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                toast.error("Failed to init booking");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 2 Submit: Register Card
    const onSubmitStep2 = async (data) => {
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
                setStep(3); // Enter SMS
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

    // Step 3 Submit: Confirm Payment
    const onSubmitStep3 = async (data) => {
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
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-600">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {step === 1 && <MdCalendarToday />}
                            {step === 2 && <MdPayment />}
                            {step === 3 && <MdLock />}
                            {step === 1 ? 'Booking Details' : step === 2 ? 'Payment' : 'Verify SMS'}
                        </h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <MdClose size={24} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto">

                        {/* STEP 1: Details */}
                        {step === 1 && (
                            <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Check In</label>
                                        <input {...register('check_in', { required: true })} type="date" className="w-full p-2 border rounded dark:bg-slate-700" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Check Out</label>
                                        <input {...register('check_out', { required: true })} type="date" className="w-full p-2 border rounded dark:bg-slate-700" />
                                    </div>
                                </div>

                                <div className="border-t pt-4 dark:border-slate-700">
                                    <h3 className="text-sm font-bold text-indigo-600 mb-2">Guest Info</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input {...register('passport', { required: true })} placeholder="Passport (AA1234567)" className="w-full p-2 border rounded uppercase dark:bg-slate-700" />
                                        <input {...register('birthday', { required: true })} type="date" className="w-full p-2 border rounded dark:bg-slate-700" />
                                    </div>
                                    <select {...register('citizen')} className="w-full p-2 border rounded mt-2 dark:bg-slate-700">
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <div className="relative mt-2">
                                        <input {...register('guest_name', { required: true })} placeholder="Full Name" className={`w-full p-2 border rounded dark:bg-slate-700 ${isCheckingPerson ? 'bg-gray-100 animate-pulse' : ''}`} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input {...register('guest_email')} placeholder="Email" type="email" className="w-full p-2 border rounded dark:bg-slate-700" />
                                    <input {...register('guest_phone', { required: true })} placeholder="Phone (998901234567)" className="w-full p-2 border rounded dark:bg-slate-700" />
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: Card Payment */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount</p>
                                    <p className="text-2xl font-bold text-indigo-600">150,000 UZS</p>
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
                                <button type="button" onClick={() => setStep(1)} className="w-full text-gray-500 text-sm hover:underline">Back to Details</button>
                            </form>
                        )}

                        {/* STEP 3: SMS */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit(onSubmitStep3)} className="space-y-6 text-center">
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
