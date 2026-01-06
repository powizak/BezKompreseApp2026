import SupportSection from './SupportSection';

export default function Footer() {
    return (
        <footer className="mt-auto">
            <SupportSection />
            <div className="text-center py-6 text-slate-400 text-xs font-medium border-t border-slate-200/50">
                <p>&copy; 2026 Bez Komprese Fan App. Not affiliated officially.</p>
            </div>
        </footer>
    );
}
