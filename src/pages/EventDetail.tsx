import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { AppEvent, UserProfile } from '../types';
import { MapPin, Calendar, ArrowLeft, Share2, Check, User, AlertCircle } from 'lucide-react';
import EventMap from '../components/EventMap';
import { useAuth } from '../contexts/AuthContext';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<AppEvent | null>(null);
    const [creator, setCreator] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            const dataService = Effect.runSync(
                Effect.gen(function* (_) {
                    return yield* _(DataService);
                }).pipe(Effect.provide(DataServiceLive))
            );

            const eventData = await Effect.runPromise(dataService.getEventById(id));
            if (eventData) {
                setEvent(eventData);
                // Fetch creator
                const creatorData = await Effect.runPromise(dataService.getUserProfile(eventData.creatorId));
                if (creatorData) {
                    setCreator(creatorData.profile);
                }
            } else {
                navigate('/events');
            }
            setLoading(false);
        };

        fetchData();
    }, [id, navigate]);

    if (loading || !event) return <div className="p-10 text-center font-mono">Načítám detail...</div>;

    return (
        <div className="max-w-2xl mx-auto pb-10 relative">
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-6">
                <Link to="/events" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold uppercase text-xs tracking-wide transition-colors">
                    <ArrowLeft size={16} /> Zpět na seznam
                </Link>
                <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-full">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {!user && (
                <div className="bg-brand/20 border border-brand text-slate-900 p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm">
                    <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold uppercase tracking-wide text-sm mb-1">Jste v režimu náhledu</h3>
                        <p className="text-sm font-medium opacity-80 mb-2">Pro účast na srazu, zobrazení účastníků a diskuzi se musíte přihlásit.</p>
                        <Link to="/login" className="text-xs font-black uppercase tracking-wider underline hover:no-underline">Přihlásit se nyní</Link>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                <div className="bg-[#111111] text-white p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md ${event.type === 'official' ? 'bg-brand text-brand-contrast' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
                                {event.type === 'official' ? 'Oficiální akce' : 'Komunitní sraz'}
                            </span>
                            {creator && (
                                <Link to={`/profile/${creator.uid}`} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
                                    <div className="w-5 h-5 rounded-full bg-slate-500 overflow-hidden">
                                        {creator.photoURL ? <img src={creator.photoURL} alt={creator.displayName || 'User'} /> : <User size={12} className="m-1" />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{creator.displayName || 'Organizátor'}</span>
                                </Link>
                            )}
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
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Účastníci (příklad)</span>
                            </div>

                            <button
                                onClick={() => setJoined(!joined)}
                                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${joined ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-brand text-brand-contrast hover:bg-white hover:text-black shadow-lg shadow-brand/20 border-2 border-transparent hover:border-slate-200'}`}
                            >
                                {joined ? <><Check size={20} /> Jdu tam</> : 'Zúčastním se'}
                            </button>
                        </>
                    ) : (
                        <div className="w-full text-center py-2 flex flex-col items-center">
                            <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Pro účast se musíte přihlásit</p>
                            <Link to="/login" className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black">Přihlásit se</Link>
                        </div>
                    )}
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
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${!user ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-wide">
                    <span className="bg-slate-900 w-1.5 h-6 block skew-x-[-15deg]"></span>
                    Diskuze
                </h3>

                {!user && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-white/90 p-4 rounded-xl shadow-lg font-bold text-slate-900">
                            <Link to="/login">Přihlašte se pro diskuzi</Link>
                        </div>
                    </div>
                )}

                <div className="space-y-6 mb-6">
                    {/* Comments mock */}
                    <p className="text-sm text-slate-400 italic">Zatím žádné komentáře.</p>
                </div>

                <div className="flex gap-2">
                    <input disabled={!user} placeholder="Napsat komentář..." className="flex-1 border-2 border-slate-100 bg-slate-50 p-3 rounded-xl focus:border-slate-300 focus:bg-white outline-none transition-colors text-sm font-medium" />
                    <button disabled={!user} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Odeslat</button>
                </div>
            </div>

        </div>
    );
}