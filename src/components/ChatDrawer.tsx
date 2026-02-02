import { useEffect, useState, useRef } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import { Send, X, MessageSquare } from 'lucide-react';
import type { Message } from '../types/chat';

interface ChatDrawerProps {
    roomId: string;
    recipientName: string;
    onClose: () => void;
}

export default function ChatDrawer({ roomId, recipientName, onClose }: ChatDrawerProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        const streamEffect = dataService.getMessagesStream(roomId);
        const stream = Effect.runSync(streamEffect);
        const reader = stream.getReader();

        let isActive = true;
        const read = async () => {
            while (isActive) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) setMessages(value);
            }
        };
        read();

        return () => {
            isActive = false;
            reader.cancel();
        };
    }, [roomId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        await Effect.runPromise(dataService.sendMessage(roomId, {
            senderId: user.uid,
            text: inputText.trim()
        }));

        setInputText('');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 inset-x-0 h-[85vh] md:h-full md:inset-x-auto md:right-0 md:top-0 md:w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 rounded-t-3xl md:rounded-none md:border-l border-slate-200">
                <div className="p-4 bg-brand text-brand-contrast flex justify-between items-center shadow-md rounded-t-3xl md:rounded-none">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={20} />
                        <h3 className="font-black uppercase italic tracking-tighter">{recipientName}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                            <MessageSquare size={48} />
                            <p className="font-medium text-sm">Zatím žádné zprávy</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium shadow-sm transition-all hover:shadow-md ${isMe
                                        ? 'bg-brand text-brand-contrast rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 safe-area-bottom">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Napiš zprávu..."
                            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                            autoFocus
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="bg-brand text-brand-contrast p-3 rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
