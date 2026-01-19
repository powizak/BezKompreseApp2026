import SupportSection from './SupportSection';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../contexts/CookieConsentContext';

export default function Footer() {
    const { resetConsent } = useCookieConsent();

    return (
        <footer className="mt-auto">
            <SupportSection />
            <div className="text-center py-6 text-slate-400 text-xs font-medium border-t border-slate-200/50 flex flex-col gap-3">
                <p>&copy; 2026 Bez Komprese Fan App. Not affiliated officially.</p>
                <div className="flex justify-center gap-4 text-[10px] uppercase tracking-wider font-bold">
                    <Link to="/privacy" className="hover:text-brand transition-colors">Ochrana soukromí</Link>
                    <button onClick={resetConsent} className="hover:text-brand transition-colors">Nastavení cookies</button>
                </div>
            </div>
        </footer>
    );
}
