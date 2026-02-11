import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8">Smluvní podmínky</h1>
                    <p className="text-xl text-zinc-400">
                        Pravidla používání aplikace Bez Komprese Fan App.
                    </p>
                </header>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Úvodní ustanovení</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Provozovatelem aplikace "Bez Komprese Fan App" je <strong>Jakub Prošek</strong> (dále jen "Provozovatel").
                        Vstupem do aplikace, registrací a jejím používáním vyjadřujete svůj výslovný souhlas s těmito podmínkami ("VOP") a se Zásadami ochrany soukromí.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Uživatelský účet</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Pro plné využití aplikace je nutná registrace (přihlášení přes Google). Uživatel odpovídá za to, že údaje poskytnuté při registraci jsou pravdivé. Uživatel nese plnou odpovědnost za veškerou aktivitu na svém účtu.
                        Provozovatel si vyhrazuje právo zablokovat nebo zrušit účet, který porušuje tyto podmínky, zákony ČR nebo dobré mravy.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Bazar a inzerce</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace umožňuje uživatelům vkládat inzeráty (nabídka/poptávka).
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Vztah stran:</strong> Provozovatel pouze poskytuje technický prostor. Kupní smlouva vzniká výhradně mezi prodávajícím a kupujícím. Provozovatel nenese odpovědnost za kvalitu, legálnost či dodání zboží.</li>
                        <li><strong>Zakázaný obsah:</strong> Je přísně zakázáno nabízet nelegální zboží, zbraně, drogy, kradené věci nebo obsah porušující práva třetích osob.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Obsah a duševní vlastnictví</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Veškerý obsah vložený uživateli (fotografie aut, texty, inzeráty) zůstává ve vlastnictví uživatele. Vložením obsahu však uživatel uděluje Provozovateli bezplatnou, nevýhradní licenci k jeho zobrazení v aplikaci.
                        Uživatel potvrzuje, že má právo příslušný obsah (zejména fotografie) zveřejnit.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Funkce aplikace (Garáž, Serviska, Tracker)</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Data evidovaná v aplikaci (servisní úkony, tankování, náklady) slouží pro osobní evidenci uživatele.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                        <li><strong>Přesnost:</strong> Provozovatel negarantuje přesnost výpočtů (např. spotřeby) ani správnost dat v servisní knížce.</li>
                        <li><strong>Tracker:</strong> Sdílení polohy je dobrovolné. Uživatel bere na vědomí rizika spojená se sdílením polohy. Provozovatel neodpovídá za případné zneužití polohy třetími stranami, pokud uživatel tuto funkci aktivoval.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Omezení odpovědnosti</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace je poskytována "tak, jak je". Provozovatel nenese odpovědnost za případné výpadky služby, ztrátu dat ani za škody vzniklé používáním aplikace. Toto není oficiální aplikace značky "Bez Komprese".
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">7. Změny podmínek a kontakt</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Tyto podmínky můžeme kdykoli aktualizovat. Pokračováním v používání aplikace po změně vyjadřujete souhlas s novým zněním.
                    </p>
                    <p className="text-zinc-400 leading-relaxed mt-4">
                        Kontakt na provozovatele: <a href="mailto:hello@jakubprosek.cz" className="text-white hover:underline">hello@jakubprosek.cz</a>
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

export default TermsOfService;
