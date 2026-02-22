import { Bell, X, AlertTriangle, Calendar, MessageCircle, Car, Store } from 'lucide-react';

interface NotificationPromptDialogProps {
    onAccept: () => Promise<void>;
    onDismiss: () => void;
    isProcessing: boolean;
}

const benefits = [
    { icon: AlertTriangle, text: 'SOS volání od ostatních řidičů', color: 'text-red-500' },
    { icon: Calendar, text: 'Nové srazy a akce v okolí', color: 'text-blue-500' },
    { icon: MessageCircle, text: 'Nové zprávy a komentáře', color: 'text-green-500' },
    { icon: Car, text: 'Připomínky STK, pojištění a servisu', color: 'text-orange-500' },
    { icon: Store, text: 'Nové inzeráty v bazaru', color: 'text-purple-500' },
];

export default function NotificationPromptDialog({ onAccept, onDismiss, isProcessing }: NotificationPromptDialogProps) {
    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                {/* Header gradient */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pb-8 text-center relative">
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors"
                        aria-label="Zavřít"
                    >
                        <X size={18} />
                    </button>

                    <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-brand/30">
                        <Bell size={32} className="text-brand" />
                    </div>

                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                        Zapni si oznámení
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">
                        Nic ti neunikne
                    </p>
                </div>

                {/* Benefits list */}
                <div className="px-6 py-5 space-y-3">
                    {benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                <b.icon size={16} className={b.color} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{b.text}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 pt-2 space-y-3">
                    <button
                        onClick={onAccept}
                        disabled={isProcessing}
                        className="w-full bg-brand text-brand-contrast py-3.5 rounded-2xl font-black uppercase italic tracking-tighter text-sm shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <span className="animate-pulse">Zpracovávám…</span>
                        ) : (
                            <>
                                <Bell size={18} />
                                Povolit oznámení
                            </>
                        )}
                    </button>
                    <button
                        onClick={onDismiss}
                        disabled={isProcessing}
                        className="w-full py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Teď ne
                    </button>
                </div>
            </div>
        </div>
    );
}
