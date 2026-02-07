import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, X, Navigation } from 'lucide-react';

// Fix default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    value: { address: string; coordinates: { lat: number; lng: number } | null };
    onChange: (value: { address: string; coordinates: { lat: number; lng: number } | null }) => void;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to recenter map
function MapRecenter({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [showMap, setShowMap] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 50.0755, lng: 14.4378 }); // Prague default

    // Reverse geocoding to get address from coordinates
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'cs' } }
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch {
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    };

    // Forward geocoding to get coordinates from address
    const searchAddress = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=cz,sk`,
                { headers: { 'Accept-Language': 'cs' } }
            );
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setMapCenter(coords);
                onChange({ address: display_name, coordinates: coords });
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleMapClick = async (lat: number, lng: number) => {
        const coords = { lat, lng };
        onChange({ address: value.address, coordinates: coords });
        const address = await reverseGeocode(lat, lng);
        onChange({ address, coordinates: coords });
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                setMapCenter(coords);
                onChange({ address: value.address, coordinates: coords });
                const address = await reverseGeocode(coords.lat, coords.lng);
                onChange({ address, coordinates: coords });
            },
            (error) => console.error('Geolocation error:', error)
        );
    };

    return (
        <div className="space-y-3">
            {/* Address Input with Search */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={value.address}
                        onChange={(e) => {
                            onChange({ ...value, address: e.target.value });
                            setSearchQuery(e.target.value);
                        }}
                        placeholder="Zadejte adresu nebo vyberte na mapě"
                        className="w-full border-2 border-slate-200 bg-slate-50 p-3 pr-10 rounded-xl focus:border-brand focus:ring-0 outline-none font-medium transition-colors"
                    />
                    {value.coordinates && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <MapPin size={18} className="text-green-500" />
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={searchAddress}
                    disabled={searching || !value.address.trim()}
                    className="px-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50"
                >
                    <Search size={20} />
                </button>
            </div>

            {/* GPS Info */}
            {value.coordinates && (
                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-1 rounded">
                        {value.coordinates.lat.toFixed(5)}, {value.coordinates.lng.toFixed(5)}
                    </span>
                    <button
                        type="button"
                        onClick={() => onChange({ address: value.address, coordinates: null })}
                        className="text-red-400 hover:text-red-600"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Toggle Map Button */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${showMap
                            ? 'bg-brand text-brand-contrast'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <MapPin size={16} />
                    {showMap ? 'Skrýt mapu' : 'Vybrat na mapě'}
                </button>
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                    title="Použít moji polohu"
                >
                    <Navigation size={16} />
                </button>
            </div>

            {/* Map */}
            {showMap && (
                <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <MapContainer
                        center={value.coordinates || mapCenter}
                        zoom={value.coordinates ? 15 : 7}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onLocationSelect={handleMapClick} />
                        <MapRecenter center={value.coordinates || mapCenter} />
                        {value.coordinates && (
                            <Marker position={value.coordinates} />
                        )}
                    </MapContainer>
                    <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 font-medium border-t border-slate-200">
                        Klikněte na mapu pro výběr přesné polohy
                    </div>
                </div>
            )}
        </div>
    );
}
