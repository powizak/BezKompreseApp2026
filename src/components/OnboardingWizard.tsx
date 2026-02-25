import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Navigation, Bell, ShieldAlert, Car, Map, X, CheckCircle2, ChevronDown } from 'lucide-react';

interface OnboardingWizardProps {
    onComplete: () => void;
    onRequestNotifications: () => Promise<boolean>;
    isProcessing: boolean;
    permissionStatus: string;
}

export default function OnboardingWizard({ onComplete, onRequestNotifications, isProcessing, permissionStatus }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [notificationsRequested, setNotificationsRequested] = useState(false);
    const [canScroll, setCanScroll] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // 5px threshold to account for decimal rounding
            setCanScroll(scrollHeight - scrollTop - clientHeight > 5);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        // Delay to ensure content is fully rendered before checking
        const timer = setTimeout(checkScroll, 100);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [currentStep]);

    const nextStep = () => {
        if (currentStep < slides.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleRequestNotifications = async () => {
        const granted = await onRequestNotifications();
        setNotificationsRequested(true);
        if (granted) {
            setTimeout(() => {
                nextStep();
            }, 1000);
        }
    };

    const slides = [
        {
            title: 'Vítej v Bez Komprese',
            subtitle: 'Tvůj digitální garážmistr',
            icon: <Car size={48} className="text-brand" />,
            content: (
                <div className="space-y-4 text-slate-600 text-sm font-medium">
                    <p>Jsme komunita pro všechny autíčkáře! Udržuj si přehled o všech svých vozidlech na jednom místě.</p>
                    <ul className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> Digitální servisní knížka a evidence tankování.</li>
                        <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> Komunitní bazar pro náhradní díly a služby.</li>
                        <li className="flex gap-2 items-center"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> Skupinové srazy, vyjížďky a komunitní akce.</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'Live Tracker & S.O.S',
            subtitle: 'Jsme v tom spolu',
            icon: <Map size={48} className="text-blue-500" />,
            content: (
                <div className="space-y-4 text-slate-600 text-sm font-medium">
                    <p>Live Tracker ti ukáže, kdo z komunity zrovna jezdí po okolí. Můžeš sdílet svou polohu a vidět ostatní na mapě.</p>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                        <div className="flex gap-2 items-start text-red-700">
                            <ShieldAlert size={20} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block mb-1">Nouzové SOS tlačítko</span>
                                Pokud na cestě píchneš, nebo ti dojde benzín, jedním kliknutím přivoláš pomoc od lidí poblíž.
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2 items-start text-amber-700 text-xs text-left">
                        <Navigation size={14} className="flex-shrink-0 mt-0.5" />
                        <p>Až poprvé otevřeš Live Tracker, zeptáme se tě na <strong>přístup k poloze</strong>. Bez něj se na mapě neuvidíme.</p>
                    </div>
                </div>
            )
        },
        {
            title: 'Buď v obraze',
            subtitle: 'Notifikace, na kterých záleží',
            icon: <Bell size={48} className="text-brand" />,
            content: (
                <div className="space-y-4 text-slate-600 text-sm font-medium">
                    <p>Abys zjistil(a), když tvůj kamarád zrovna stiskl SOS, nebo že se blíží večerní vyjížďka, potřebujeme tě upozornit.</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-3">
                        <div className="flex gap-2 items-center">
                            <ShieldAlert size={16} className="flex-shrink-0 text-red-500" />
                            <span>S.O.S. volání o pomoc v okolí</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Car size={16} className="flex-shrink-0 text-orange-500" />
                            <span>Blížící se STK a pojistky z Garáže</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />
                            <span>Nové zprávy v chatu a u akcí</span>
                        </div>
                    </div>

                    {permissionStatus === 'denied' && (
                        <div className="bg-red-50 p-3 rounded-xl text-red-700 text-xs font-bold mt-4">
                            Oznámení jsi na zařízení zakázal(a). Povol je pls v nastavení!
                        </div>
                    )}
                </div>
            )
        }
    ];

    const isLastSlide = currentStep === slides.length - 1;

    return (
        <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-4">
            {/* Minimal Background Styling */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
            </div>

            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-20 flex items-center gap-1 font-bold text-xs uppercase"
            >
                Přeskočit <X size={14} />
            </button>

            <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-full animate-in zoom-in-95 duration-500">
                {/* Scrollable Content Wrapper */}
                <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex-1 overflow-y-auto px-6 py-10 relative no-scrollbar"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl rotate-3">
                                {slides[currentStep].icon}
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-1">
                                {slides[currentStep].title}
                            </h2>
                            <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">
                                {slides[currentStep].subtitle}
                            </h3>

                            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                                {slides[currentStep].content}
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div
                        className={`absolute bottom-6 right-6 transition-opacity duration-300 pointer-events-none z-10 ${canScroll ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="bg-brand text-brand-contrast p-1.5 rounded-full shadow-lg animate-bounce border border-brand/20">
                            <ChevronDown size={22} strokeWidth={3} />
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Action Area */}
                <div className="bg-white border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0 z-10">

                    {/* Progress indicators */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-brand' : 'w-2 bg-slate-200'}`}
                            />
                        ))}
                    </div>

                    {isLastSlide ? (
                        <div className="space-y-3">
                            {permissionStatus === 'prompt' && !notificationsRequested && (
                                <button
                                    onClick={handleRequestNotifications}
                                    disabled={isProcessing}
                                    className="w-full bg-brand text-brand-contrast py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    {isProcessing ? 'Moment...' : 'Povolit oznámení'}
                                </button>
                            )}
                            <button
                                onClick={onComplete}
                                className={`w-full py-4 text-sm font-bold rounded-2xl transition-all flex justify-center items-center gap-2 ${(permissionStatus === 'prompt' && !notificationsRequested)
                                    ? 'text-slate-400 hover:bg-slate-50'
                                    : 'bg-brand text-brand-contrast font-black uppercase italic tracking-tighter shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95'
                                    }`}
                            >
                                {(permissionStatus === 'prompt' && !notificationsRequested) ? 'Nechci notifikace' : 'Vstoupit do apky'} <ChevronRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
                        >
                            Pokračovat <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
