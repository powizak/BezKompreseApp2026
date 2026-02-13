import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';
import { Search, Users as UsersIcon, UserPlus, UserMinus, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginRequired from '../components/LoginRequired';
import LoadingState from '../components/LoadingState';
import UserAvatar from '../components/UserAvatar';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
    const [randomUsers, setRandomUsers] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);

    // Initial Load - Top 5 & Random 9
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const loadInitialData = async () => {
            setLoading(true);
            const dataService = Effect.runSync(
                Effect.gen(function* (_) {
                    return yield* _(DataService);
                }).pipe(Effect.provide(DataServiceLive))
            );

            try {
                // Fetch Top 5
                const top = await Effect.runPromise(dataService.getTopUsers(5));
                setTopUsers(top);

                // Fetch Random 9
                const random = await Effect.runPromise(dataService.getRandomUsers(9));
                setRandomUsers(random);
            } catch (e) {
                console.error("Failed to load users", e);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [currentUser]);

    // Search Logic
    const performSearch = async () => {
        if (!searchQuery.trim()) {
            setUsers([]);
            return;
        }

        setSearching(true);
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        try {
            const results = await Effect.runPromise(dataService.searchUsers(searchQuery));
            setUsers(results);
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch();
    };

    const handleFriendAction = async (targetId: string, isFriend: boolean) => {
        if (!currentUser) return;

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        try {
            if (isFriend) {
                await Effect.runPromise(dataService.removeFriend(currentUser.uid, targetId));
            } else {
                await Effect.runPromise(dataService.addFriend(currentUser.uid, targetId));
            }
            // Optimistic update or reload could go here. 
            // For now, simpler to leave generic without full reload to avoid jarring UX.
        } catch (e) {
            console.error(e);
        }
    };

    if (!currentUser) {
        return (
            <LoginRequired
                title="Komunita je zamčená"
                message="Pro hledání parťáků a prohlížení profilů se musíte přihlásit."
                icon={UsersIcon}
            />
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 pb-20">
            <div className="text-center py-10 space-y-4">
                <h2 className="text-5xl font-black italic text-slate-900 uppercase tracking-tighter">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">Komunita</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                    Najdi parťáky na projížďky, do garáže nebo na kafe.
                </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto px-4">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <input
                        type="text"
                        placeholder="Hledat uživatele (Jméno, přezdívka)..."
                        className="relative w-full pl-14 pr-14 py-5 rounded-full bg-white border-2 border-slate-100 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none font-bold text-lg text-slate-900 placeholder:text-slate-400 shadow-xl shadow-slate-200/50 transition-all"
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            if (e.target.value === '') setUsers([]); // Clear results on clear
                        }}
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <button
                        type="submit"
                        disabled={searching || !searchQuery}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-3 rounded-full hover:bg-brand hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-slate-900 disabled:hover:text-white"
                    >
                        {searching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                    </button>
                </form>
            </div>

            {loading ? (
                <LoadingState message="Načítám komunitu..." className="py-20" />
            ) : (
                <>
                    {/* Search Results Mode */}
                    {users.length > 0 || (searchQuery && searching) ? (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 px-4">Výsledky hledání</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map(u => (
                                    <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} />
                                ))}
                            </div>
                            {users.length === 0 && !searching && (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <UsersIcon className="mx-auto text-slate-300 mb-2" size={48} />
                                    <p className="text-slate-500 font-medium">Nikdo nenalezen.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* Top Users */}
                            {topUsers.length > 0 && (
                                <section className="relative">
                                    {/* Decorative background element */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-slate-50/50 -skew-y-3 -z-10" />

                                    <div className="flex items-center gap-3 mb-8 px-4">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                                            <Heart className="fill-current" size={24} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-wider text-slate-900">
                                            Nejoblíbenější
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {topUsers.map((u, i) => (
                                            <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} highlight rank={i + 1} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Random / Discovery */}
                            <section>
                                <div className="flex items-center gap-3 mb-8 px-4">
                                    <div className="p-2 bg-brand/20 text-brand-dark rounded-xl">
                                        <UsersIcon size={24} />
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-wider text-slate-900">
                                        Objevuj další
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {randomUsers.map(u => (
                                        <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} />
                                    ))}
                                </div>

                                <div className="mt-12 text-center">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-full font-bold text-slate-700 hover:border-brand hover:text-brand transition-all"
                                    >
                                        <UsersIcon size={18} />
                                        Načíst další lidi
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function UserCard({ user, currentUser, onFriendAction, highlight, rank }: { user: UserProfile, currentUser: UserProfile | null, onFriendAction: any, highlight?: boolean, rank?: number }) {
    const isMe = currentUser?.uid === user.uid;
    const isFriend = currentUser?.friends?.includes(user.uid);

    return (
        <div className={`group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${highlight ? 'border-2 border-brand/20 shadow-xl shadow-brand/10' : 'border border-slate-100 shadow-sm hover:shadow-md'}`}>
            {highlight && rank && (
                <div className="absolute top-0 right-0 bg-brand text-brand-contrast text-xs font-black px-3 py-1.5 rounded-bl-2xl z-10">
                    #{rank}
                </div>
            )}

            <div className="p-5 flex items-center gap-4">
                <Link to={`/profile/${user.uid}`} className="shrink-0 relative">
                    <div className={`w-16 h-16 rounded-full border-2 ${highlight ? 'border-brand' : 'border-slate-100 group-hover:border-brand/50'} transition-colors`}>
                        <UserAvatar user={user} size={28} className="w-full h-full" />
                    </div>
                    {isFriend && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                            <Heart size={10} className="fill-current" />
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    <Link to={`/profile/${user.uid}`} className="block truncate font-bold text-slate-900 hover:text-brand transition-colors text-lg">
                        {user.displayName || 'Bezejmenný'}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {user.friendsCount || user.friends?.length || 0} přátel
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5 pt-0">
                {!isMe && currentUser && (
                    <button
                        onClick={() => onFriendAction(user.uid, isFriend)}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isFriend
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-slate-900 text-white hover:bg-brand hover:text-black shadow-lg shadow-slate-900/20 hover:shadow-brand/20'
                            }`}
                    >
                        {isFriend ? (
                            <>
                                <UserMinus size={16} /> Přestat sledovat
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} /> Sledovat
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
