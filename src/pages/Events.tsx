import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { AppEvent } from '../types';
import { MapPin, Map as MapIcon, List, Plus, X, ChevronRight } from 'lucide-react';
import EventMap from '../components/EventMap';
import { Link } from 'react-router-dom';

export default function Events() {
    const { user } = useAuth();
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ title: '', description: '', location: '', date: '', type: 'meetup' as const });

    const loadEvents = () => {
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        Effect.runPromise(dataService.getEvents).then(data => {
            setEvents(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        const newEvent = {
            creatorId: user.uid,
            title: formData.title,
            description: formData.description,
            location: formData.location,
            date: new Date(formData.date).toISOString(),
            type: 'meetup' as const,
            coordinates: { lat: 50.0755, lng: 14.4378 }
        };

        await Effect.runPromise(dataService.addEvent(newEvent));
        setShowForm(false);
        loadEvents();
    };

    if (loading) return <div className="p-10 text-center text-slate-500 font-mono">Načítám akce...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Kalendář akcí</h2>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Oficiální akce i komunitní srazy</p>
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

            {user ? (
                !showForm ? (
                    <button onClick={() => setShowForm(true)} className="w-full mb-8 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-400 hover:border-brand hover:text-slate-900 hover:bg-brand/5 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wide group">
                        <div className="bg-slate-200 text-slate-500 rounded-full p-2 group-hover:bg-brand group-hover:text-brand-contrast transition-colors">
                            <Plus size={24} />
                        </div>
                        Uspořádat vlastní sraz
                    </button>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-2 relative">
                        <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                        <h3 className="font-black text-xl mb-6 uppercase italic tracking-wide">Nový sraz</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Název akce</label>
                                <input required className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" placeholder="Např. Večerní projížďka" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Kdy</label>
                                    <input required type="datetime-local" className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Kde</label>
                                    <input required className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-bold transition-colors" placeholder="Město / Místo" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Popis</label>
                                <textarea required className="w-full border-2 border-slate-200 bg-slate-50 p-3 rounded-xl focus:border-brand focus:ring-0 outline-none font-medium transition-colors h-24" placeholder="Podrobnosti o srazu..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white font-black uppercase tracking-wider py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/20">Zveřejnit sraz</button>
                        </form>
                    </div>
                )
            ) : (
                <div className="bg-[#111111] p-6 rounded-2xl mb-8 flex items-center justify-between text-white shadow-lg">
                    <div>
                        <p className="font-bold text-lg">Chceš uspořádat sraz?</p>
                        <p className="text-sm text-slate-400">Přihlaš se a pozvi ostatní.</p>
                    </div>
                    <Link to="/login" className="bg-brand text-brand-contrast px-5 py-2.5 rounded-lg font-bold uppercase text-sm tracking-wide hover:bg-white hover:text-black transition-colors">Přihlásit se</Link>
                </div>
            )}

            {viewMode === 'map' ? (
                <EventMap events={events} />
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className={`bg-white rounded-2xl shadow-sm p-0 border overflow-hidden ${event.type === 'official' ? 'border-brand/50' : 'border-slate-100 hover:border-slate-300'} transition-all hover:shadow-md group`}>
                            <div className="flex flex-col md:flex-row">
                                {/* Date Box */}
                                <div className="bg-slate-50 md:w-32 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{new Date(event.date).toLocaleDateString('cs-CZ', { month: 'short' })}</span>
                                    <span className="text-3xl font-black text-slate-900">{new Date(event.date).getDate()}</span>
                                    <span className="text-sm font-bold text-slate-500 mt-1">{new Date(event.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${event.type === 'official' ? 'bg-brand text-brand-contrast' : 'bg-slate-100 text-slate-500'}`}>
                                            {event.type === 'official' ? 'Oficiální akce' : 'Komunitní sraz'}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-xl mb-2 group-hover:text-brand transition-colors">{event.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>

                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} className={event.type === 'official' ? 'text-brand' : 'text-slate-400'} />
                                            {event.location}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Link to={`/profile/${event.creatorId}`} className="hover:text-brand hover:underline">
                                                Organizátor
                                            </Link>
                                        </div>
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
                    ))}
                </div>
            )}
        </div>
    );
}
