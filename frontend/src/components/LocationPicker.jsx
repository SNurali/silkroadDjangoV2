import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React
// Leaflet's default icon paths are often broken in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    useMapEvents({
        click(e) {
            const newPos = [e.latlng.lat, e.latlng.lng];
            setPosition(newPos);
            if (onLocationSelect) {
                onLocationSelect(newPos);
            }
        },
    });

    return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({ value, onChange, className }) {
    // Default to Tashkent coordinates if no value
    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (value) {
            const [lat, lng] = value.split(',').map(n => parseFloat(n.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
                setPosition([lat, lng]);
            }
        }
    }, [value]);

    const handleSelect = (pos) => {
        const strVal = `${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}`;
        onChange(strVal);
    };

    const defaultCenter = [41.2995, 69.2401]; // Tashkent

    return (
        <div className={`h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0 ${className}`}>
            <MapContainer
                center={position || defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationSelect={handleSelect}
                />
            </MapContainer>
        </div>
    );
}
