import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { AppEvent } from '../types';
import { MapPin, Calendar, ArrowLeft, Share2, Check } from 'lucide-react';
import EventMap from '../components/EventMap';
import { useAuth } from '../contexts/AuthContext';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<AppEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!id) return;
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        Effect.runPromise(dataService.getEventById(id)).then(data => {
            if (data) {
                setEvent(data);
            } else {
                navigate('/events');
            }
            setLoading(false);
        });
    }, [id, navigate]);

    if (loading || !event) return <div className="p-10 text-center font-mono">Načítám detail...</div>;

    return (
        <div className="max-w-2xl mx-auto pb-10">
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-6">
                <Link to="/events" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold uppercase text-xs tracking-wide transition-colors">
                    <ArrowLeft size={16} /> Zpět na seznam
                </Link>
                <button className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
                    <Share2 size={20} />
                </button>
            </div>

            {/* Hero Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                <div className="bg-[#111111] text-white p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md ${event.type === 'official' ? 'bg-brand text-brand-contrast' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
                                {event.type === 'official' ? 'Oficiální akce' : 'Komunitní sraz'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-6 uppercase italic tracking-wide leading-tight">{event.title}</h1>
                        <div className="flex flex-col gap-3 text-sm font-bold text-slate-300 uppercase tracking-wide">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg text-brand"><Calendar size={20} /></div>
                                {new Date(event.date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg text-brand"><MapPin size={20} /></div>
                                {event.location}
                            </div>
                        </div>
                    </div>
                    {/* Decorative BG */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent opacity-50"></div>
                </div>

                <div className="p-8">
                    <h2 className="font-black text-lg mb-4 uppercase tracking-wide text-slate-900">O akci</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">{event.description}</p>
                </div>

                {/* Action Bar */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex -space-x-3 overflow-hidden">
                            {/* Mock avatars */}
                            {[1, 2, 3].map(i => (
                                <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    {i}
                                </div>
                            ))}
                            <div className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                +12
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">se účastní</span>
                    </div>

                    <button
                        onClick={() => setJoined(!joined)}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${joined ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-brand text-brand-contrast hover:bg-white hover:text-black shadow-lg shadow-brand/20 border-2 border-transparent hover:border-slate-200'}`}
                    >
                        {joined ? <><Check size={20} /> Jdu tam</> : 'Zúčastním se'}
                    </button>
                </div>
            </div>

            {/* Map */}
            <div className="mb-8">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase italic tracking-wide">
                    <span className="bg-brand w-1.5 h-6 block skew-x-[-15deg]"></span>
                    Kde to bude
                </h3>
                {event.coordinates ? (
                    <EventMap events={[event]} />
                ) : (
                    <div className="bg-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium">Mapa není k dispozici</div>
                )}
            </div>

            {/* Discussion (Mock) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-wide">
                    <span className="bg-slate-900 w-1.5 h-6 block skew-x-[-15deg]"></span>
                    Diskuze
                </h3>

                <div className="space-y-6 mb-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                        <div>
                            <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-sm text-slate-700 border border-slate-100">
                                <p className="font-black text-xs mb-1 uppercase tracking-wide text-slate-900">Honza Novák</p>
                                Bude se platit nějaké vstupné?
                            </div>
                            <div className="mt-1 ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Před 2 hod</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input disabled={!user} placeholder={user ? "Napsat komentář..." : "Pro komentování se přihlašte"} className="flex-1 border-2 border-slate-100 bg-slate-50 p-3 rounded-xl focus:border-slate-300 focus:bg-white outline-none transition-colors text-sm font-medium" />
                    <button disabled={!user} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Odeslat</button>
                </div>
            </div>

        </div>
    );
}