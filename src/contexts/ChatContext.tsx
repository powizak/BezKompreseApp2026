import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { DataService, DataServiceLive } from '../services/DataService';
import { Effect } from 'effect';
import type { ChatRoom } from '../types/chat';

interface ActiveChat {
    roomId: string;
    recipientName: string;
    recipientId: string;
}

interface ChatContextType {
    activeChat: ActiveChat | null;
    openChat: (roomId: string, recipientId: string, recipientName: string) => void;
    closeChat: () => void;
    unreadMap: Record<string, boolean>; // roomId -> hasUnread
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
    const [, setChats] = useState<ChatRoom[]>([]);
    const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!user) {
            setChats([]);
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
                    setChats(prevChats => {
                        // Check for new messages
                        const newUnread: Record<string, boolean> = {};
                        value.forEach(chat => {
                            const prevChat = prevChats.find(p => p.id === chat.id);
                            // If chat just updated and it's not the active one, mark as unread
                            // This is a simple heuristic: if timestamp changed.
                            // Real impl needs 'readAt' field.
                            if (prevChat && prevChat.updatedAt?.toMillis() !== chat.updatedAt?.toMillis()) {
                                if (activeChat?.roomId !== chat.id) {
                                    // It's an update to a background chat
                                    newUnread[chat.id] = true;
                                }
                            }
                        });
                        if (Object.keys(newUnread).length > 0) {
                            setUnreadMap(prev => ({ ...prev, ...newUnread }));
                        }
                        return value;
                    });
                }
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
        };
    }, [user?.uid, activeChat]);

    // Clear unread when opening chat
    const openChat = (roomId: string, recipientId: string, recipientName: string) => {
        setActiveChat({ roomId, recipientId, recipientName });
        setUnreadMap(prev => {
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    };

    const closeChat = () => setActiveChat(null);

    return (
        <ChatContext.Provider value={{ activeChat, openChat, closeChat, unreadMap }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
