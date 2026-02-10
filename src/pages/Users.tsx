import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';
import { Search, Users as UsersIcon, UserPlus, UserMinus, User, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginRequired from '../components/LoginRequired';
import CachedImage from '../components/CachedImage';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
    const [randomUsers, setRandomUsers] = useState<UserProfile[]>([]);

    const loadUsers = async (queryStr?: string) => {
        setLoading(true);
        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        try {
            if (queryStr) {
                const results = await Effect.runPromise(dataService.searchUsers(queryStr));
                setUsers(results);
            } else {
                // Initial load: Get users and sort client side for "Top" and "Random"
                const allUsers = await Effect.runPromise(dataService.getAllUsers(20));
                setUsers(allUsers);

                // Top Users Logic (Most friends)
                const sortedByFriends = [...allUsers].sort((a, b) => (b.friends?.length || 0) - (a.friends?.length || 0));
                setTopUsers(sortedByFriends.slice(0, 5));

                // Random Users Logic - 10 users
                const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
                setRandomUsers(shuffled.slice(0, 10));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadUsers();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers(searchQuery);
    };

    const handleFriendAction = async (targetId: string, isFriend: boolean) => {
        if (!currentUser) return;

        const dataService = Effect.runSync(
            Effect.gen(function* (_) {
                return yield* _(DataService);
            }).pipe(Effect.provide(DataServiceLive))
        );

        if (isFriend) {
            await Effect.runPromise(dataService.removeFriend(currentUser.uid, targetId));
        } else {
            await Effect.runPromise(dataService.addFriend(currentUser.uid, targetId));
        }
        // Refresh local state ideally, or force reload
        // straightforward way:
        loadUsers(searchQuery);
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center py-8">
                <h2 className="text-4xl font-black italic text-brand mb-3 uppercase tracking-tighter">Komunita</h2>
                <p className="text-slate-600 text-lg">Najdi parťáky na projížďky a do garáže.</p>
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Hledat uživatele..."
                        className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-slate-200 focus:border-brand focus:ring-0 outline-none font-bold text-lg shadow-sm transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2.5 rounded-full hover:bg-brand hover:text-black transition-colors">
                        <Search size={20} />
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="text-center p-10 text-slate-400">Načítám lidi...</div>
            ) : (
                <>
                    {/* Search Results Mode */}
                    {searchQuery ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map(u => (
                                <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} />
                            ))}
                            {users.length === 0 && <p className="col-span-full text-center text-slate-500">Nikdo nenalezen.</p>}
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Top Users */}
                            {topUsers.length > 0 && (
                                <section>
                                    <h3 className="text-xl font-black italic uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <Heart className="text-red-500 fill-red-500" size={24} /> Nejoblíbenější členové
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {topUsers.map(u => (
                                            <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} highlight />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Random / All Users */}
                            <section>
                                <h3 className="text-xl font-black italic uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <UsersIcon className="text-brand" size={24} /> Další petrolheadi
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {randomUsers.map(u => (
                                        <UserCard key={u.uid} user={u} currentUser={currentUser} onFriendAction={handleFriendAction} />
                                    ))}
                                </div>
                                {users.length > 15 && (
                                    <div className="mt-6 text-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-slate-600 font-medium">
                                            <Search className="inline-block mr-2" size={20} />
                                            Hledáš někoho konkrétního? Použij vyhledávání výše.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function UserCard({ user, currentUser, onFriendAction, highlight }: { user: UserProfile, currentUser: UserProfile | null, onFriendAction: any, highlight?: boolean }) {
    const isMe = currentUser?.uid === user.uid;
    // Note: currentUser.friends might be outdated if we don't refresh auth context, but let's assume it's decent or we rely on page reload for now.
    // Actually, for better UX we might want to pass checked state or user fetched state.
    // Ideally we check if `user.uid` is in `currentUser.friends`.
    const isFriend = currentUser?.friends?.includes(user.uid);

    return (
        <div className={`bg-white p-4 rounded-2xl border ${highlight ? 'border-brand shadow-lg shadow-brand/10' : 'border-slate-100 shadow-sm'} flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group`}>
            {highlight && <div className="absolute top-0 right-0 bg-brand text-brand-contrast text-[10px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">TOP</div>}

            <Link to={`/profile/${user.uid}`} className="shrink-0">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${highlight ? 'border-brand' : 'border-slate-100'}`}>
                    {user.photoURL ? (
                        <CachedImage src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <User size={24} />
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.uid}`} className="block truncate font-bold text-slate-900 hover:text-brand transition-colors text-lg">
                    {user.displayName || 'Bezejmenný'}
                </Link>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    {user.friends?.length || 0} přátel
                </p>
            </div>

            {!isMe && currentUser && (
                <button
                    onClick={() => onFriendAction(user.uid, isFriend)}
                    className={`p-2 rounded-full transition-colors ${isFriend ? 'bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50' : 'bg-slate-900 text-white hover:bg-brand hover:text-black'}`}
                    title={isFriend ? "Odebrat z přátel" : "Přidat do přátel"}
                >
                    {isFriend ? <UserMinus size={18} /> : <UserPlus size={18} />}
                </button>
            )}
        </div>
    )
}
