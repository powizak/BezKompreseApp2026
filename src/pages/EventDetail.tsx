import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { AppEvent, UserProfile, EventComment } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../types';
import { MapPin, Calendar, ArrowLeft, Share2, Check, User, Navigation, ExternalLink, Users, FileText, Phone, Send, Trash2 } from 'lucide-react';
import EventMap from '../components/EventMap';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/imageService';
import LoginRequired from '../components/LoginRequired';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<AppEvent | null>(null);
    const [creator, setCreator] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);
    const [joiningLoading, setJoiningLoading] = useState(false);

    // Comments state
    const [comments, setComments] = useState<EventComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    const fetchComments = useCallback(async () => {
        if (!id) return;
        const commentsData = await Effect.runPromise(dataService.getEventComments(id));
        setComments(commentsData);
    }, [id, dataService]);

    useEffect(() => {
        if (!id || !user) return;

        const fetchData = async () => {
            const eventData = await Effect.runPromise(dataService.getEventById(id));
            if (eventData) {
                setEvent(eventData);
                setJoined(eventData.participants?.includes(user.uid) || false);
                const creatorData = await Effect.runPromise(dataService.getUserProfile(eventData.creatorId));
                if (creatorData) {
                    setCreator(creatorData.profile);
                }
                await fetchComments();
            } else {
                navigate('/events');
            }
            setLoading(false);
        };

        fetchData();
    }, [id, navigate, user, dataService, fetchComments]);

    const handleJoinEvent = async () => {
        if (!id || !user || joiningLoading) return;
        setJoiningLoading(true);
        try {
            if (joined) {
                await Effect.runPromise(dataService.leaveEvent(id, user.uid));
                setJoined(false);
                setEvent(prev => prev ? { ...prev, participants: prev.participants?.filter(p => p !== user.uid) } : prev);
            } else {
                await Effect.runPromise(dataService.joinEvent(id, user.uid));
                setJoined(true);
                setEvent(prev => prev ? { ...prev, participants: [...(prev.participants || []), user.uid] } : prev);
            }
        } catch (error) {
            console.error('Failed to update participation:', error);
        }
        setJoiningLoading(false);
    };

    const handleAddComment = async () => {
        if (!id || !user || !newComment.trim() || addingComment) return;
        setAddingComment(true);
        try {
            await Effect.runPromise(dataService.addEventComment({
                eventId: id,
                userId: user.uid,
                userName: user.displayName || 'Anonymní uživatel',
                userPhotoURL: user.photoURL || undefined,
                text: newComment.trim()
            }));
            setNewComment('');
            await fetchComments();
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
        setAddingComment(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await Effect.runPromise(dataService.deleteEventComment(commentId));
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const openNavigation = () => {
        if (!event?.coordinates) return;
        const { lat, lng } = event.coordinates;
        // Open Google Maps with directions
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    if (loading || !event) {
        return (
            <div className="p-10 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full mx-auto mb-4"></div>
                <p className="font-bold uppercase tracking-wide text-sm text-slate-400">Načítám detail...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <LoginRequired
                title="Detail akce je zamčený"
                message="Pro zobrazení detailů akcí se musíte přihlásit."
                icon={Calendar}
            />
        );
    }

    const typeColors = EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.minisraz;
    const typeLabel = EVENT_TYPE_LABELS[event.eventType] || 'Akce';
    const isTrackday = event.eventType === 'trackday';
    const participantCount = event.participants?.length || 0;

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

            {/* Hero Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                {/* Hero Image */}
                {event.imageUrl ? (
                    <div className="relative h-56 md:h-72">
                        <img src={getImageUrl(event.imageUrl, 'large')} alt={event.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md ${typeColors.bg} ${typeColors.text}`}>
                                    {typeLabel}
                                </span>
                                {event.price && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md bg-green-500 text-white">
                                        {event.price}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-wide leading-tight">{event.title}</h1>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#111111] text-white p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md ${typeColors.bg} ${typeColors.text}`}>
                                        {typeLabel}
                                    </span>
                                    {event.price && (
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md bg-green-500 text-white">
                                            {event.price}
                                        </span>
                                    )}
                                </div>
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
                        </div>
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent opacity-50"></div>
                    </div>
                )}

                {/* Event Info */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="bg-slate-100 p-2 rounded-lg text-brand"><Calendar size={18} /></div>
                            <div>
                                <div>{new Date(event.date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                <div className="text-slate-400 text-xs">
                                    {new Date(event.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                                    {event.endDate && (
                                        <> – {new Date(event.endDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="bg-slate-100 p-2 rounded-lg text-brand"><MapPin size={18} /></div>
                            <div>{event.location}</div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="bg-slate-100 p-2 rounded-lg text-brand"><Users size={18} /></div>
                            <div>{participantCount} {participantCount === 1 ? 'účastník' : participantCount >= 2 && participantCount <= 4 ? 'účastníci' : 'účastníků'}{event.capacity && ` / ${event.capacity}`}</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="p-6">
                    <h2 className="font-black text-lg mb-4 uppercase tracking-wide text-slate-900">O akci</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">{event.description}</p>
                </div>

                {/* Trackday Specific Info */}
                {isTrackday && (event.rules || event.registrationUrl || event.contactInfo) && (
                    <div className="p-6 bg-green-50 border-t border-green-100">
                        <h2 className="font-black text-lg mb-4 uppercase tracking-wide text-green-800 flex items-center gap-2">
                            <FileText size={20} /> Trackday informace
                        </h2>

                        {event.rules && (
                            <div className="mb-4">
                                <h3 className="font-bold text-sm text-green-700 uppercase mb-2">Pravidla / Co mít s sebou</h3>
                                <p className="text-green-800 text-sm whitespace-pre-wrap">{event.rules}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4">
                            {event.registrationUrl && (
                                <a
                                    href={event.registrationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm uppercase hover:bg-green-700 transition-colors"
                                >
                                    <ExternalLink size={16} /> Registrace
                                </a>
                            )}
                            {event.contactInfo && (
                                <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
                                    <Phone size={16} /> {event.contactInfo}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Bar */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {event.coordinates && (
                            <button
                                onClick={openNavigation}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <Navigation size={16} /> Navigovat
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleJoinEvent}
                        disabled={joiningLoading}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${joined ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-brand text-brand-contrast hover:bg-white hover:text-black shadow-lg shadow-brand/20 border-2 border-transparent hover:border-slate-200'}`}
                    >
                        {joiningLoading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : joined ? (
                            <><Check size={20} /> Jdu tam</>
                        ) : (
                            'Zúčastním se'
                        )}
                    </button>
                </div>
            </div>

            {/* Organizer Info */}
            {creator && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase italic tracking-wide">
                        <span className="bg-brand w-1.5 h-6 block skew-x-[-15deg]"></span>
                        Organizátor
                    </h3>
                    <Link to={`/profile/${creator.uid}`} className="flex items-center gap-4 group">
                        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden">
                            {creator.photoURL ? (
                                <img src={creator.photoURL} alt={creator.displayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24} /></div>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-lg group-hover:text-brand transition-colors">{creator.displayName || 'Neznámý uživatel'}</div>
                            {event.contactInfo && !isTrackday && (
                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                    <Phone size={14} /> {event.contactInfo}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            )}

            {/* Map */}
            <div className="mb-8">
                <h3 className="font-black text-lg mb-4 flex items-center gap-2 uppercase italic tracking-wide">
                    <span className="bg-brand w-1.5 h-6 block skew-x-[-15deg]"></span>
                    Kde to bude
                </h3>
                {event.coordinates ? (
                    <>
                        <EventMap events={[event]} />
                        <button
                            onClick={openNavigation}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-black transition-colors"
                        >
                            <Navigation size={18} /> Otevřít navigaci
                        </button>
                    </>
                ) : (
                    <div className="bg-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium">Mapa není k dispozici</div>
                )}
            </div>

            {/* Discussion */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-wide">
                    <span className="bg-slate-900 w-1.5 h-6 block skew-x-[-15deg]"></span>
                    Diskuze
                    {comments.length > 0 && (
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full ml-2">{comments.length}</span>
                    )}
                </h3>

                <div className="space-y-4 mb-6">
                    {comments.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Zatím žádné komentáře. Buď první!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                                <Link to={`/profile/${comment.userId}`} className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        {comment.userPhotoURL ? (
                                            <img src={comment.userPhotoURL} alt={comment.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={16} /></div>
                                        )}
                                    </div>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link to={`/profile/${comment.userId}`} className="font-bold text-sm text-slate-900 hover:text-brand transition-colors">
                                            {comment.userName}
                                        </Link>
                                        <span className="text-xs text-slate-400">
                                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Právě teď'}
                                        </span>
                                        {comment.userId === user.uid && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ml-auto"
                                                title="Smazat komentář"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 break-words">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                        placeholder="Napsat komentář..."
                        className="flex-1 border-2 border-slate-100 bg-slate-50 p-3 rounded-xl focus:border-slate-300 focus:bg-white outline-none transition-colors text-sm font-medium"
                        disabled={addingComment}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addingComment}
                        className="bg-slate-900 text-white px-4 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {addingComment ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}