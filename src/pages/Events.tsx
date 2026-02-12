import { useEffect, useState, useMemo } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { AppEvent, EventType, UserProfile } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../types';
import { MapPin, Map as MapIcon, List, Plus, X, ChevronRight, Upload, Calendar, Filter, Flag, Users, DollarSign, Link as LinkIcon, FileText, Phone } from 'lucide-react';
import EventMap from '../components/EventMap';
import LocationPicker from '../components/LocationPicker';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../lib/imageService';
import LoginRequired from '../components/LoginRequired';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';

const ALL_EVENT_TYPES: EventType[] = ['minisraz', 'velky_sraz', 'trackday', 'vyjizdka'];

export default function Events() {
    const { user } = useAuth();
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<EventType | 'all'>('all');
    const [filterUpcoming, setFilterUpcoming] = useState<boolean | 'all'>(true);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        date: '',
        endDate: '',
        eventType: 'minisraz' as EventType,
        registrationUrl: '',
        price: '',
        capacity: '',
        rules: '',
        contactInfo: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [locationData, setLocationData] = useState<{ address: string; coordinates: { lat: number; lng: number } | null }>({ address: '', coordinates: null });

    // Get available event types from current events (for filter)
    const availableTypes = useMemo(() => {
        const types = new Set(events.map(e => e.eventType));
        return ALL_EVENT_TYPES.filter(t => types.has(t));
    }, [events]);

    // Filtered events
    const filteredEvents = useMemo(() => {
        let result = [...events];

        if (filterType !== 'all') {
            result = result.filter(e => e.eventType === filterType);
        }

        if (filterUpcoming !== 'all') {
            const now = new Date().toISOString();
            result = result.filter(e => filterUpcoming ? e.date >= now : e.date < now);
        }

        // Sort by date
        return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events, filterType, filterUpcoming]);

    const loadEvents = async () => {
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        const data = await Effect.runPromise(dataService.getEvents);
        setEvents(data);
        setLoading(false);
    };

    const loadUserProfile = async () => {
        if (!user) return;
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        const result = await Effect.runPromise(dataService.getUserProfile(user.uid));
        if (result) {
            setUserProfile(result.profile);
        }
    };

    useEffect(() => {
        if (user) {
            loadEvents();
            loadUserProfile();
        } else {
            setLoading(false);
        }
    }, [user?.uid]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Check if user can create trackday
        if (formData.eventType === 'trackday' && !userProfile?.isOrganizer) {
            alert('Pro vytvoření Trackday musíte mít status organizátora.');
            return;
        }

        setSubmitting(true);

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        try {
            const newEvent: Omit<AppEvent, 'id'> = {
                creatorId: user.uid,
                title: formData.title,
                description: formData.description,
                location: locationData.address || formData.location,
                date: new Date(formData.date).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                eventType: formData.eventType,
                coordinates: locationData.coordinates || undefined,
                registrationUrl: formData.eventType === 'trackday' ? formData.registrationUrl || undefined : undefined,
                price: formData.eventType === 'trackday' ? formData.price || undefined : undefined,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                rules: formData.eventType === 'trackday' ? formData.rules || undefined : undefined,
                contactInfo: formData.contactInfo || undefined
            };

            const eventId = await Effect.runPromise(dataService.addEvent(newEvent));

            // Upload image if provided
            if (imageFile) {
                const imageUrl = await Effect.runPromise(dataService.uploadEventImage(imageFile, eventId));
                await Effect.runPromise(dataService.updateEvent(eventId, { imageUrl }));
            }

            // Reset form
            setShowForm(false);
            setFormData({
                title: '', description: '', location: '', date: '', endDate: '',
                eventType: 'minisraz', registrationUrl: '', price: '', capacity: '', rules: '', contactInfo: ''
            });
            setImageFile(null);
            setImagePreview(null);
            setLocationData({ address: '', coordinates: null });
            loadEvents();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Nepodařilo se vytvořit akci. Zkuste to prosím znovu.');
        } finally {
            setSubmitting(false);
        }
    };

    const isTrackday = formData.eventType === 'trackday';
    const canCreateTrackday = userProfile?.isOrganizer === true;

    if (!user) {
        return (
            <LoginRequired
                title="Kalendář akcí je zamčený"
                message="Pro zobrazení srazů a akcí se musíte přihlásit."
                icon={MapIcon}
            />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Kalendář akcí</h2>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Srazy, vyjížďky a trackdays</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <List size={18} /> <span className="hidden sm:inline">Seznam</span>
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${viewMode === 'map' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <MapIcon size={18} /> <span className="hidden sm:inline">Mapa</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filtr:</span>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-brand focus:ring-0 outline-none"
                        >
                            <option value="all">Všechny typy</option>
                            {availableTypes.map(type => (
                                <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time Filter */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setFilterUpcoming(true)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterUpcoming === true ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Nadcházející
                        </button>
                        <button
                            onClick={() => setFilterUpcoming(false)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterUpcoming === false ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Minulé
                        </button>
                        <button
                            onClick={() => setFilterUpcoming('all')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterUpcoming === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Vše
                        </button>
                    </div>

                    <div className="ml-auto text-xs text-slate-400 font-medium">
                        {filteredEvents.length} {filteredEvents.length === 1 ? 'akce' : filteredEvents.length < 5 ? 'akce' : 'akcí'}
                    </div>
                </div>
            </div>

            {/* Create Event Button / Form */}
            {!showForm ? (
                <button onClick={() => setShowForm(true)} className="w-full mb-8 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-400 hover:border-brand hover:text-slate-900 hover:bg-brand/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wide group">
                    <div className="bg-slate-200 text-slate-500 rounded-full p-2 group-hover:bg-brand group-hover:text-brand-contrast transition-colors">
                        <Plus size={24} />
                    </div>
                    Vytvořit akci
                </button>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-2 relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                    <h3 className="font-black text-xl mb-6 uppercase italic tracking-wide">Nová akce</h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Event Type */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Typ akce</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {ALL_EVENT_TYPES.map(type => {
                                    const disabled = type === 'trackday' && !canCreateTrackday;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => setFormData({ ...formData, eventType: type })}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.eventType === type
                                                ? `${EVENT_TYPE_COLORS[type].bg} ${EVENT_TYPE_COLORS[type].text} border-current`
                                                : disabled
                                                    ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {EVENT_TYPE_LABELS[type]}
                                            {type === 'trackday' && !canCreateTrackday && (
                                                <span className="block text-[10px] font-medium mt-1 opacity-60">Pouze pro organizátory</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Náhledový obrázek</label>
                            <div className="relative">
                                {imagePreview ? (
                                    <div className="relative rounded-xl overflow-hidden">
                                        <CachedImage src={imagePreview} alt="Preview" className="w-full h-48 object-cover" noCache />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                                        <Upload size={24} className="text-slate-400 mb-2" />
                                        <span className="text-sm font-medium text-slate-400">Klikni pro nahrání</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Název akce</label>
                            <input required className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" placeholder="Např. Večerní projížďka" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                                    <Calendar size={14} /> Začátek
                                </label>
                                <input required type="datetime-local" className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                                    <Calendar size={14} /> Konec <span className="text-slate-400 font-medium">(volitelné)</span>
                                </label>
                                <input type="datetime-local" className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                                <MapPin size={14} /> Místo konání
                            </label>
                            <LocationPicker
                                value={locationData}
                                onChange={setLocationData}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Popis</label>
                            <textarea required className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-medium transition-colors h-24" placeholder="Podrobnosti o akci..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        {/* Trackday specific fields */}
                        {isTrackday && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                                <h4 className="font-bold text-green-800 uppercase text-sm flex items-center gap-2">
                                    <Flag size={16} /> Trackday informace
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-2">
                                            <LinkIcon size={14} /> Registrace URL
                                        </label>
                                        <input className="w-full border-2 border-green-200 bg-white p-3 rounded-xl focus:border-green-500 focus:ring-0 outline-none font-medium transition-colors" placeholder="https://..." value={formData.registrationUrl} onChange={e => setFormData({ ...formData, registrationUrl: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-2">
                                            <DollarSign size={14} /> Cena
                                        </label>
                                        <input className="w-full border-2 border-green-200 bg-white p-3 rounded-xl focus:border-green-500 focus:ring-0 outline-none font-bold transition-colors" placeholder="Např. 2500 Kč" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-2">
                                            <Users size={14} /> Kapacita
                                        </label>
                                        <input type="number" className="w-full border-2 border-green-200 bg-white p-3 rounded-xl focus:border-green-500 focus:ring-0 outline-none font-bold transition-colors" placeholder="Počet míst" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-2">
                                            <Phone size={14} /> Kontakt
                                        </label>
                                        <input className="w-full border-2 border-green-200 bg-white p-3 rounded-xl focus:border-green-500 focus:ring-0 outline-none font-medium transition-colors" placeholder="Email nebo telefon" value={formData.contactInfo} onChange={e => setFormData({ ...formData, contactInfo: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-2">
                                        <FileText size={14} /> Pravidla / Co mít s sebou
                                    </label>
                                    <textarea className="w-full border-2 border-green-200 bg-white p-3 rounded-xl focus:border-green-500 focus:ring-0 outline-none font-medium transition-colors h-20" placeholder="Např. Helma povinná, požadavky na auto..." value={formData.rules} onChange={e => setFormData({ ...formData, rules: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {/* Contact for non-trackday */}
                        {!isTrackday && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2">
                                    <Phone size={14} /> Kontakt <span className="text-slate-400 font-medium">(volitelné)</span>
                                </label>
                                <input className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-medium transition-colors" placeholder="Email nebo telefon" value={formData.contactInfo} onChange={e => setFormData({ ...formData, contactInfo: e.target.value })} />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white font-black uppercase tracking-wider py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Ukládám...
                                </>
                            ) : (
                                'Vytvořit akci'
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Events List */}
            {loading ? (
                <LoadingState message="Načítám akce..." className="p-12" />
            ) : filteredEvents.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <List size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-700 mb-1">Žádné akce nenalezeny</h3>
                    <p className="text-sm">Zkuste změnit filtry nebo vytvořte novou akci!</p>
                </div>
            ) : viewMode === 'map' ? (
                <EventMap events={filteredEvents} />
            ) : (
                <div className="space-y-4">
                    {filteredEvents.map(event => {
                        const typeColors = EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.minisraz;
                        const typeLabel = EVENT_TYPE_LABELS[event.eventType] || 'Akce';

                        return (
                            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 transition-all hover:shadow-md group overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    {/* Image or Date Box */}
                                    {event.imageUrl ? (
                                        <div className="md:w-48 h-32 md:h-auto">
                                            <CachedImage src={getImageUrl(event.imageUrl, 'thumb')} alt={event.title} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 md:w-32 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{new Date(event.date).toLocaleDateString('cs-CZ', { month: 'short' })}</span>
                                            <span className="text-3xl font-black text-slate-900">{new Date(event.date).getDate()}</span>
                                            <span className="text-sm font-bold text-slate-500 mt-1">{new Date(event.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-5 flex-1">
                                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${typeColors.bg} ${typeColors.text}`}>
                                                {typeLabel}
                                            </span>
                                            {event.price && (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                    {event.price}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-xl mb-2 group-hover:text-brand transition-colors">{event.title}</h3>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>

                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={16} className="text-slate-400" />
                                                {event.location}
                                            </div>
                                            {event.imageUrl && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    {new Date(event.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                                                </div>
                                            )}
                                            {event.capacity && (
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={16} className="text-slate-400" />
                                                    {event.capacity} míst
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="p-5 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/50">
                                        <Link to={`/events/${event.id}`} className="w-full md:w-auto text-center text-xs font-black bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-brand hover:text-brand-contrast transition-all uppercase tracking-wider flex items-center justify-center gap-2 group-hover:shadow-lg">
                                            Detail <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
