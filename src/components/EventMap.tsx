import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { AppEvent } from '../types';
import L from 'leaflet';

// Fix default icon issue in Leaflet + Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface EventMapProps {
    events: AppEvent[];
}

export default function EventMap({ events }: EventMapProps) {
    // Center on Czech Republic mostly
    const defaultCenter = { lat: 49.8, lng: 15.5 }; 
    const zoom = 7;

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0 relative">
            <MapContainer center={defaultCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {events.map(event => {
                    if (!event.coordinates) return null;
                    return (
                        <Marker key={event.id} position={event.coordinates}>
                            <Popup>
                                <div className="min-w-[150px]">
                                    <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{event.location}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${event.type === 'official' ? 'bg-brand text-white' : 'bg-slate-100'}`}>
                                        {event.type === 'official' ? 'Oficiální' : 'Sraz'}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    );
}
