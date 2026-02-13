import { useState, useEffect } from 'react';
import {
    Calendar, MapPin, Upload,
    Link as LinkIcon, FileText, Phone,
    Flag, Users, DollarSign
} from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../types';
import type { AppEvent, EventType, UserProfile } from '../types';
import LocationPicker from './LocationPicker';
import CachedImage from './CachedImage';

const ALL_EVENT_TYPES: EventType[] = ['minisraz', 'velky_sraz', 'trackday', 'vyjizdka'];

export interface EventFormData {
    title: string;
    description: string;
    location: string;
    date: string;
    endDate: string;
    eventType: EventType;
    registrationUrl: string;
    price: string;
    capacity: string;
    rules: string;
    contactInfo: string;
    coordinates?: { lat: number; lng: number };
}

interface EventFormProps {
    initialData?: Partial<AppEvent>;
    onSubmit: (data: Omit<AppEvent, 'id' | 'creatorId'>, imageFile: File | null) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    userProfile: UserProfile | null;
    submitLabel?: string;
}

export default function EventForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    userProfile,
    submitLabel = 'Uložit akci'
}: EventFormProps) {
    const [formData, setFormData] = useState<EventFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        location: initialData?.location || '',
        date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        eventType: initialData?.eventType || 'minisraz',
        registrationUrl: initialData?.registrationUrl || '',
        price: initialData?.price || '',
        capacity: initialData?.capacity?.toString() || '',
        rules: initialData?.rules || '',
        contactInfo: initialData?.contactInfo || '',
        coordinates: initialData?.coordinates
    });

    const [locationData, setLocationData] = useState<{ address: string; coordinates: { lat: number; lng: number } | null }>({
        address: initialData?.location || '',
        coordinates: initialData?.coordinates || null
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        typeof initialData?.imageUrl === 'string' ? initialData.imageUrl :
            (initialData?.imageUrl as any)?.large || null
    );

    // Update form location when LocationPicker changes
    useEffect(() => {
        if (locationData.address) {
            setFormData(prev => ({
                ...prev,
                location: locationData.address,
                coordinates: locationData.coordinates || undefined
            }));
        }
    }, [locationData]);

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

        // Prepare data for submission
        const submissionData: Omit<AppEvent, 'id' | 'creatorId'> = {
            title: formData.title,
            description: formData.description,
            location: formData.location,
            date: new Date(formData.date).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            eventType: formData.eventType,
            coordinates: formData.coordinates,
            registrationUrl: formData.eventType === 'trackday' ? formData.registrationUrl || undefined : undefined,
            price: formData.eventType === 'trackday' ? formData.price || undefined : undefined,
            capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
            rules: formData.eventType === 'trackday' ? formData.rules || undefined : undefined,
            contactInfo: formData.contactInfo || undefined,
            // Preserve existing image URL if no new file is uploaded
            imageUrl: imageFile ? undefined : initialData?.imageUrl,
        };

        // Remove undefined keys to avoid Firestore "invalid-argument" error during update
        const cleanedData = Object.fromEntries(
            Object.entries(submissionData).filter(([_, v]) => v !== undefined)
        ) as Omit<AppEvent, 'id' | 'creatorId'>;

        await onSubmit(cleanedData, imageFile);
    };

    const isTrackday = formData.eventType === 'trackday';
    const canCreateTrackday = userProfile?.isOrganizer === true;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event Type */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Typ akce</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {ALL_EVENT_TYPES.map(type => {
                        // Allow keeping existing trackday type even if not organizer (editing case)
                        const disabled = type === 'trackday' && !canCreateTrackday && formData.eventType !== 'trackday';
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
                                {type === 'trackday' && !canCreateTrackday && formData.eventType !== 'trackday' && (
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
                        <div className="relative rounded-xl overflow-hidden group">
                            <CachedImage src={imagePreview} alt="Preview" className="w-full h-48 object-cover" noCache={!!imageFile} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-slate-100"
                                >
                                    Změnit obrázek
                                </button>
                            </div>
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

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 rounded-xl font-bold uppercase tracking-wide border-2 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-slate-900 text-white font-black uppercase tracking-wider py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ukládám...
                        </>
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
}
