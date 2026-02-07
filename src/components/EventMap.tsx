import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { AppEvent, EventType } from '../types';
import { EVENT_TYPE_LABELS } from '../types';
import L from 'leaflet';
import { Link } from 'react-router-dom';

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

// Custom colored markers for different event types
const createColoredIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
    });
};

const EVENT_MARKER_COLORS: Record<EventType, string> = {
    minisraz: '#3B82F6',    // Blue
    velky_sraz: '#8B5CF6',  // Purple
    trackday: '#22C55E',    // Green
    vyjizdka: '#F97316',    // Orange
};

interface EventMapProps {
    events: AppEvent[];
}

export default function EventMap({ events }: EventMapProps) {
    // Center on Czech Republic
    const defaultCenter = { lat: 49.8, lng: 15.5 };
    const zoom = 7;

    const openNavigation = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0 relative">
            {/* Legend */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Typy akcí</div>
                <div className="space-y-1.5">
                    {(Object.entries(EVENT_MARKER_COLORS) as [EventType, string][]).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-medium text-slate-600">{EVENT_TYPE_LABELS[type]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {events.map(event => {
                    if (!event.coordinates) return null;

                    const markerColor = EVENT_MARKER_COLORS[event.eventType] || '#64748b';
                    const icon = createColoredIcon(markerColor);
                    const typeLabel = EVENT_TYPE_LABELS[event.eventType] || 'Akce';

                    return (
                        <Marker key={event.id} position={event.coordinates} icon={icon}>
                            <Popup>
                                <div className="min-w-[180px] p-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: markerColor }}
                                        />
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            {typeLabel}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                                    <p className="text-xs text-slate-500 mb-1">{event.location}</p>
                                    <p className="text-xs text-slate-400 mb-3">
                                        {new Date(event.date).toLocaleDateString('cs-CZ', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/events/${event.id}`}
                                            className="flex-1 text-center text-[10px] font-bold uppercase bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors"
                                        >
                                            Detail
                                        </Link>
                                        <button
                                            onClick={() => openNavigation(event.coordinates!.lat, event.coordinates!.lng)}
                                            className="flex-1 text-center text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Navigovat
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
