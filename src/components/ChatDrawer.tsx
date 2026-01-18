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
        <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="p-4 bg-brand text-brand-contrast flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <MessageSquare size={20} />
                    <h3 className="font-black uppercase italic tracking-tighter">{recipientName}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg">
                    <X size={24} />
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
                {messages.map(msg => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${isMe
                                ? 'bg-brand text-brand-contrast rounded-tr-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Napiš zprávu..."
                        className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand"
                    />
                    <button
                        onClick={handleSend}
                        className="bg-brand text-brand-contrast p-2 rounded-xl hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
