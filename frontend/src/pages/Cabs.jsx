import React from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Navigation, Clock, ShieldCheck, ChevronRight, Star, CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Fix for default Leaflet icon
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Cabs() {
    const { t } = useTranslation();

    const [cabTypes, setCabTypes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedCab, setSelectedCab] = React.useState(null);
    const [isbookingOpen, setIsBookingOpen] = React.useState(false);

    // Map State
    const [showMap, setShowMap] = React.useState(false);
    const [mapMode, setMapMode] = React.useState('pickup'); // 'pickup' or 'dropoff'
    const [locations, setLocations] = React.useState({ pickup: '', dropoff: '' });
    const [coords, setCoords] = React.useState({ pickup: null, dropoff: null });

    const handleBook = (cab) => {
        setSelectedCab(cab);
        setIsBookingOpen(true);
        // Reset state
        setLocations({ pickup: '', dropoff: '' });
        setCoords({ pickup: null, dropoff: null });
        setShowMap(false);
    };

    function LocationMarker({ mode, setCoords, setLocations }) {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setCoords(prev => ({ ...prev, [mode]: [lat, lng] }));
                // In a real app, do reverse geocoding here
                setLocations(prev => ({ ...prev, [mode]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
            },
        });
        return coords[mode] ? <Marker position={coords[mode]} /> : null;
    }

    React.useEffect(() => {
        api.get('/cabs/')
            .then(res => {
                setCabTypes(res.data.results || res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch cabs", err);
                setLoading(false);
            });
    }, []);

    const getIconBySlug = (slug) => {
        if (slug && slug.includes('minivan')) return Car; // Could use Bus if available
        if (slug && slug.includes('bus')) return Car;
        return Car;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20">
            {/* Hero */}
            <section className="relative bg-slate-900 py-32 overflow-hidden">
                {/* ... existing hero code ... */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/80 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl opacity-30 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <ShieldCheck size={14} /> {t('cabs.safe_reliable', 'Safe & Reliable')}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white">
                            <Trans i18nKey="cabs.hero_title">
                                O'zbekiston bo'ylab ishonchli <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">transferlar</span>
                            </Trans>
                        </h1>
                        <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                            {t('cabs.hero_subtitle', 'Tasdiqlangan haydovchilar va belgilangan narxlar bilan aeroportdan kutib olish, shahar bo\'ylab yoki shaharlararo taksi xizmatlarini band qiling.')}
                        </p>

                        <div className="flex gap-5 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-sm">
                            <div className="flex -space-x-3">
                                {['https://randomuser.me/api/portraits/men/32.jpg', 'https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/men/86.jpg', 'https://randomuser.me/api/portraits/women/68.jpg'].map((src, i) => (
                                    <img key={i} src={src} alt="Traveler" className="w-12 h-12 rounded-full border-2 border-slate-800 object-cover shadow-lg" />
                                ))}
                            </div>
                            <div className="text-sm text-white">
                                <p className="font-bold text-lg">5,000+</p>
                                <p className="text-slate-400 text-xs flex items-center gap-1">
                                    Trusted by Travelers
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Navigation size={24} />
                            </div>
                            {t('cabs.booking_title', 'Tezkor band qilish')}
                        </h2>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('cabs.pickup', 'Olib ketish joyi')}</label>
                                <div className="group flex items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                                    <MapPin size={20} className="text-emerald-500" />
                                    <input type="text" placeholder="Airport, Hotel, or Address" className="bg-transparent w-full focus:outline-none placeholder:text-slate-400 font-medium" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('cabs.dropoff', 'Borish manzili')}</label>
                                <div className="group flex items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-colors focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                                    <MapPin size={20} className="text-emerald-500" />
                                    <input type="text" placeholder="Where are you going?" className="bg-transparent w-full focus:outline-none placeholder:text-slate-400 font-medium" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('cabs.date', 'Sana')}</label>
                                    <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" />
                                        <input type="date" className="bg-transparent w-full focus:outline-none text-sm font-medium" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('cabs.time', 'Vaqt')}</label>
                                    <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" />
                                        <input type="time" className="bg-transparent w-full focus:outline-none text-sm font-medium" />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 rounded-xl shadow-lg shadow-emerald-500/30 mt-4 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-sm">
                                {t('home.search_cabs_btn', 'Find Available Cars')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Car Types */}
            <section className="max-w-7xl mx-auto px-4 mt-24">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">{t('cabs.fleet_title', 'Our Premium Fleet')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xl">{t('cabs.fleet_subtitle', 'Choose the perfect vehicle for your journey. All cars are cleaned, insured, and driven by professional chauffeurs.')}</p>
                    </div>
                    <button className="hidden md:flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all">
                        {t('cabs.view_all', 'View Full Fleet')} <ChevronRight size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cabTypes.map((cab, i) => {
                        const IconComponent = getIconBySlug(cab.slug);
                        return (
                            <div
                                key={i}
                                onClick={() => handleBook(cab)}
                                className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                            >
                                <div className="w-full h-40 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-[1.02] transition-transform relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                                    <IconComponent size={64} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-colors" />
                                </div>

                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{cab.name}</h4>
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                                        <Star size={10} className="fill-current" /> {cab.rating}
                                    </span>
                                </div>

                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{cab.capacity}</p>

                                <div className="space-y-2 mb-6">
                                    {cab.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <CheckCircle2 size={12} className="text-emerald-500" /> {feat}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Starting from</p>
                                        <span className="text-base font-bold text-slate-900 dark:text-white">UZS {cab.price}</span>
                                    </div>
                                    <button className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white transition-colors shadow-lg">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Booking Modal */}
            {/* Booking Modal */}
            {isbookingOpen && selectedCab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative flex flex-col max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={() => setIsBookingOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                        >
                            <span className="sr-only">Close</span> ✕
                        </button>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {t('cabs.book', 'Book')} {selectedCab.name}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            {t('cabs.starting_from', 'Running from')} <span className="font-bold text-indigo-600">UZS {selectedCab.price}</span>
                        </p>

                        {showMap ? (
                            <div className="flex-1 min-h-[400px] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {t('cabs.select_location', 'Select Location on Map')}: <span className="text-indigo-500 uppercase">{mapMode}</span>
                                    </p>
                                    <button onClick={() => setShowMap(false)} className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                        {t('common.done', 'Done')}
                                    </button>
                                </div>
                                <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
                                    <MapContainer
                                        center={[41.2995, 69.2401]} // Tashkent
                                        zoom={13}
                                        style={{ height: "100%", width: "100%" }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap contributors'
                                        />
                                        <LocationMarker mode={mapMode} setCoords={setCoords} setLocations={setLocations} />
                                    </MapContainer>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 text-center">{t('cabs.map_hint', 'Click on the map to place a pin.')}</p>
                            </div>
                        ) : (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const data = {
                                    cab: selectedCab.id,
                                    passenger_name: formData.get('name'),
                                    passenger_phone: formData.get('phone'),
                                    pickup_location: locations.pickup || formData.get('pickup'),
                                    dropoff_location: locations.dropoff || formData.get('dropoff'),
                                    pickup_datetime: `${formData.get('date')}T${formData.get('time')}`
                                };

                                api.post('/cabs/bookings/', data)
                                    .then(() => {
                                        alert(t('cabs.booking_success', 'Booking Successful!'));
                                        setIsBookingOpen(false);
                                    })
                                    .catch(err => {
                                        alert(t('cabs.booking_fail', 'Booking Failed'));
                                        console.error(err);
                                    });
                            }} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('cabs.my_details', 'My Details')}</label>
                                    <input name="name" required placeholder={t('cabs.full_name', 'Full Name')} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                                    <input name="phone" required placeholder={t('cabs.phone', 'Phone Number')} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t('cabs.trip_details', 'Trip Details')}</label>

                                    {/* Pickup Input with Map Button */}
                                    <div className="flex gap-2">
                                        <input
                                            name="pickup"
                                            value={locations.pickup}
                                            onChange={(e) => setLocations({ ...locations, pickup: e.target.value })}
                                            required
                                            placeholder={t('cabs.pickup', 'Pickup Location')}
                                            className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setMapMode('pickup'); setShowMap(true); }}
                                            className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                            title="Pick on Map"
                                        >
                                            <MapPin size={20} />
                                        </button>
                                    </div>

                                    {/* Dropoff Input with Map Button */}
                                    <div className="flex gap-2">
                                        <input
                                            name="dropoff"
                                            value={locations.dropoff}
                                            onChange={(e) => setLocations({ ...locations, dropoff: e.target.value })}
                                            required
                                            placeholder={t('cabs.dropoff', 'Dropoff Location')}
                                            className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setMapMode('dropoff'); setShowMap(true); }}
                                            className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                            title="Pick on Map"
                                        >
                                            <MapPin size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <input name="date" type="date" required className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                                        <input name="time" type="time" required className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all">
                                    {t('cabs.confirm_booking', 'Confirm Booking')}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </div >
    );
}
