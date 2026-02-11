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
                        Zásady zpracování osobních údajů (GDPR) a používání souborů cookie.
                    </p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Správce údajů</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Správcem vašich osobních údajů je <strong>Jakub Prošek</strong> (dále jen "Správce").
                    </p>
                    <p className="text-zinc-400 leading-relaxed">
                        Máte-li jakékoli dotazy ohledně zpracování vašich údajů, můžete nás kontaktovat na e-mailu: <a href="mailto:hello@jakubprosek.cz" className="text-white hover:underline">hello@jakubprosek.cz</a>.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Právní základ a účel zpracování</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Vaše osobní údaje zpracováváme na základě:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Plnění smlouvy:</strong> Poskytování služeb aplikace v souladu se Všeobecnými obchodními podmínkami (registrace, vedení účtu, používání funkcí).</li>
                        <li><strong>Souhlasu:</strong> Registrací do aplikace a jejím aktivním používáním udělujete souhlas se zpracováním údajů pro účely sdílení s komunitou (např. v bazaru, chatu nebo při používání trackeru).</li>
                        <li><strong>Oprávněného zájmu:</strong> Zajištění bezpečnosti aplikace a vylepšování našich služeb.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Jaká data sbíráme</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Zpracováváme údaje, které nám sami poskytnete nebo které vznikají při používání aplikace:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Identifikační údaje:</strong> E-mailová adresa (z Google účtu), Uživatelské jméno, Profilová fotografie.</li>
                        <li><strong>Údaje o vozidlech:</strong> Informace o autech (značka, model, motorizace, rok výroby), která vložíte do "Garáže".</li>
                        <li><strong>Provozní údaje:</strong> Záznamy o tankování, nákladech, servisní knížka (opravy, údržba) a nájezd kilometrů.</li>
                        <li><strong>Komunikační údaje:</strong> Příspěvky v chatu, soukromé zprávy, komentáře.</li>
                        <li><strong>Bazar:</strong> Inzeráty, fotografie prodávaných předmětů a kontaktní údaje uvedené v inzerátu.</li>
                        <li><strong>Polohové údaje:</strong> GPS souřadnice (pouze při aktivní funkci Tracker).</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Sdílení dat a viditelnost</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace je komunitního charakteru. Některá data jsou veřejná pro ostatní uživatele aplikace:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Veřejný profil:</strong> Uživatelské jméno, foto a seznam vozidel v garáži jsou viditelné ostatním.</li>
                        <li><strong>Spotřeba:</strong> Pokud v nastavení povolíte "Sdílet spotřebu", ostatní uvidí průměrnou spotřebu vašich vozidel. Podrobné záznamy (mapa jízd, ceny) zůstávají soukromé.</li>
                        <li><strong>Servis a náklady:</strong> Detailní záznamy v servisní knížce a náklady jsou soukromé, pokud je sami nezveřejníte (např. screenshotem v chatu).</li>
                        <li><strong>Tracker:</strong> Vaše poloha je sdílena s ostatními uživateli POUZE pokud funkci aktivně zapnete. V nastavení lze definovat "Privacy Zone" (okruh bydliště), kde je poloha skryta.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Cookies a technologie</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace využívá nezbytné soubory cookie a lokální úložiště zařízení pro zajištění přihlášení a funkčnosti. Pro analýzu návštěvnosti a chyb můžeme využívat anonymizované nástroje třetích stran (Google Analytics, Firebase Crashlytics).
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Vaše práva</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Dle GDPR máte právo na:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li>Přístup ke svým údajům a jejich kopii.</li>
                        <li>Opravu nepřesných údajů (většinu lze upravit přímo v profilu).</li>
                        <li>Výmaz osobních údajů ("právo být zapomenut"), pokud již nejsou potřebné pro účel, pro který byly shromážděny.</li>
                        <li>Omezení zpracování a vznesení námitky.</li>
                    </ul>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        Pro uplatnění těchto práv nebo smazání účtu nás kontaktujte na: <a href="mailto:hello@jakubprosek.cz" className="text-white hover:underline">hello@jakubprosek.cz</a>
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
