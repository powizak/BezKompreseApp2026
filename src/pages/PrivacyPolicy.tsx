import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 font-sans animate-in fade-in duration-500">

            <button
                onClick={() => navigate(-1)}
                className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Zpět</span>
            </button>

            <div className="max-w-3xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8">Ochrana soukromí</h1>
                    <p className="text-xl text-zinc-400">
                        Zásady zpracování osobních údajů a používání souborů cookie.
                    </p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Kdo jsme</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Jsme provozovatelé aplikace <strong>Bez Komprese</strong>. Vaše soukromí je pro nás prioritou.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Jaká data sbíráme</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Při používání aplikace zpracováváme především údaje nezbytné pro vaše přihlášení a správu účtu:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li>E-mailová adresa (z Google účtu/přihlášení)</li>
                        <li>Uživatelské jméno</li>
                        <li>Profilová fotografie</li>
                        <li>Informace o vašich autech, která do aplikace vložíte</li>
                        <li>Poloha (GPS souřadnice) – pouze pokud aktivujete funkci Tracker</li>
                        <li>Chatové zprávy a historie komunikace</li>
                        <li>Seznam přátel a sociální interakce</li>
                        <li>Vámi vytvořené události a srazy</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Sledování polohy (Tracker)</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace obsahuje volitelnou funkci sdílení polohy ("Tracker"), která umožňuje zobrazit vaši aktuální polohu ostatním uživatelům na mapě.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Aktivace:</strong> Sběr polohy probíhá POUZE tehdy, pokud funkci ručně zapnete tlačítkem "Spustit sledování" nebo v nastavení profilu.</li>
                        <li><strong>Ukládání:</strong> Vaše aktuální GPS souřadnice a status jsou ukládány do naší databáze (Google Firestore, Cloud) do kolekce `presence`.</li>
                        <li><strong>Doba uchování:</strong> Ukládá se pouze aktuální poloha, která se neustále přepisuje. Historii pohybu neukládáme. Při vypnutí sledování jsou data z databáze odstraněna.</li>
                        <li><strong>Soukromí (Privacy Zone):</strong> Pokud si v profilu nastavíte "Bydliště", vaše přesná poloha se v okruhu 500m od tohoto bodu automaticky skryje/zmaskuje, aby nebylo možné identifikovat, kde bydlíte.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Cookies</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace používá technologie cookies pro zajištění funkčnosti (přihlášení, sessions). Tyto technické cookies jsou nezbytné pro chod aplikace.
                        Kromě toho můžeme využívat analytické nástroje (např. Google Analytics) pro zlepšování našich služeb, pokud nám k tomu dáte souhlas.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Vaše práva</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Máte právo na přístup ke svým údajům, jejich opravu, výmaz ("právo být zapomenut"), nebo omezení zpracování. Svá data můžete spravovat přímo v nastavení svého profilu.
                        Pro žádost o výmaz dat se obrátěte na e-mail: <a href="mailto:powizak@gmail.com">powizak@gmail.com</a>
                    </p>
                </section>

                <footer className="pt-12 border-t border-zinc-800">
                    <p className="text-sm text-zinc-500">
                        Poslední aktualizace: {new Date().toLocaleDateString('cs-CZ')}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
