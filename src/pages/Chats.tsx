import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { MessageCircle, User, ChevronRight, Trash2, X } from 'lucide-react';
import type { ChatRoom } from '../types/chat';
import LoginRequired from '../components/LoginRequired';
import ChatDrawer from '../components/ChatDrawer';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function Chats() {
    const { user } = useAuth();
    const { activeChat, openChat, closeChat, unreadMap } = useChat();
    const [chats, setChats] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!user) {
            setChats([]);
            setLoading(false);
            return;
        }

        const streamEffect = dataService.getUserChatsStream(user.uid);
        const stream = Effect.runSync(streamEffect);
        const reader = stream.getReader();

        let isActive = true;
        const read = async () => {
            while (isActive) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    setChats(value);
                    setLoading(false);

                    // Cleanup old messages for each chat (on-demand)
                    value.forEach(chat => {
                        Effect.runPromise(dataService.cleanupOldMessages(chat.id)).catch(() => {
                            // Silently ignore cleanup errors
                        });
                    });
                }
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
        };
    }, [user]);

    const handleDeleteChat = async (roomId: string) => {
        setDeleting(true);
        try {
            await Effect.runPromise(dataService.deleteChat(roomId));
            setChats(prev => prev.filter(c => c.id !== roomId));
        } catch (e) {
            console.error('Failed to delete chat:', e);
        } finally {
            setDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const getOtherParticipant = (chat: ChatRoom) => {
        if (!user) return { id: '', name: '', photo: null };
        const otherId = chat.participants.find(p => p !== user.uid) || '';
        return {
            id: otherId,
            name: chat.participantNames?.[otherId] || 'Uživatel',
            photo: chat.participantPhotos?.[otherId] || null
        };
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: cs });
    };

    if (!user) {
        return (
            <LoginRequired
                title="Zprávy jsou zamčené"
                message="Pro zobrazení konverzací se musíte přihlásit."
                icon={MessageCircle}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="p-2 bg-brand text-brand-contrast rounded-xl shadow-lg shadow-brand/20">
                    <MessageCircle size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter">Zprávy</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {chats.length === 0 ? 'Žádné konverzace' : `${chats.length} konverzací`}
                    </p>
                </div>
            </div>

            {/* Chat List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <LoadingState message="Načítám konverzace..." />
                ) : chats.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <MessageCircle size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Zatím žádné konverzace</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">
                            Začni konverzaci kliknutím na "Chat" u uživatele v Trackeru nebo na profilu.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {chats.map(chat => {
                            const other = getOtherParticipant(chat);
                            const isUnread = unreadMap[chat.id];
                            const isOwnMessage = chat.lastMessageSenderId === user?.uid;
                            const isDeleting = deleteConfirm === chat.id;

                            return (
                                <div key={chat.id} className="relative group">
                                    {/* Delete confirmation overlay */}
                                    {isDeleting && (
                                        <div className="absolute inset-0 bg-red-50 z-10 flex items-center justify-between px-4 animate-in slide-in-from-right duration-200">
                                            <span className="text-red-600 font-bold text-sm">Smazat konverzaci?</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50"
                                                >
                                                    <X size={18} className="text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChat(chat.id)}
                                                    disabled={deleting}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    {deleting ? 'Mažu...' : 'Smazat'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => openChat(chat.id, other.id, other.name)}
                                            className="flex-1 p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            {/* Avatar */}
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-md">
                                                    {other.photo ? (
                                                        <CachedImage src={other.photo} alt={other.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <User size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                {isUnread && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full border-2 border-white animate-pulse" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className={`font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                                        {other.name}
                                                    </h3>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                                        {formatTime(chat.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                                    {isOwnMessage && <span className="text-slate-400">Ty: </span>}
                                                    {chat.lastMessage || 'Žádné zprávy'}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-brand transition-colors" />
                                        </button>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => setDeleteConfirm(chat.id)}
                                            className="p-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Smazat konverzaci"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Chat Drawer */}
            {activeChat && (
                <ChatDrawer
                    roomId={activeChat.roomId}
                    recipientId={activeChat.recipientId}
                    recipientName={activeChat.recipientName}
                    onClose={closeChat}
                />
            )}
        </div>
    );
}
