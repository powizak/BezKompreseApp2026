import { useState, useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const CookieBanner = () => {
    const { consent, acceptCookies, declineCookies } = useCookieConsent();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (consent === 'pending') {
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [consent]);

    // Don't render anything if not visible (avoids layout shifts/z-index issues)
    // But we want to keep it in DOM for exit animation potentially, or just simple unmount.
    if (!visible && consent !== 'pending') return null;

    return (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] transform transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Cookie className="w-5 h-5" />
                        <span className="font-semibold text-zinc-100 tracking-wide">Sušenky?</span>
                    </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    Používáme nezbytné soubory cookie pro fungování přihlášení. Volitelné cookies nám pomáhají vylepšovat web.
                    <Link to="/privacy" className="text-white underline underline-offset-2 ml-1 hover:text-amber-500 transition-colors">Více info</Link>.
                </p>

                <div className="flex gap-3 mt-2">
                    <button
                        onClick={acceptCookies}
                        className="flex-1 bg-white text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                    >
                        V pořádku
                    </button>
                    <button
                        onClick={declineCookies}
                        className="flex-1 bg-transparent border border-zinc-700 text-zinc-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        Jen nutné
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
