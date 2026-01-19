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
                        Vstupem do aplikace "Bez Komprese Fan App" souhlasíte s těmito podmínkami. Aplikace je určena pro fanoušky komunity Bez Komprese a slouží k evidenci vozidel, sdílení polohy (tracker) a sledování komunitních událostí.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Uživatelský účet</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Pro plné využití aplikace je nutné přihlášení. Uživatel je odpovědný za veškerou aktivitu prováděnou pod jeho účtem. Je zakázáno vkládat obsah, který je urážlivý, nezákonný nebo porušuje práva třetích osob.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Obsah a duševní vlastnictví</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Veškerý obsah vložený uživateli (fotografie aut, texty) zůstává ve vlastnictví uživatele, který nám však uděluje bezplatnou licenci k jeho zobrazení v rámci aplikace. Vyhrazujeme si právo odstranit nevhodný obsah bez předchozího upozornění.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Omezení odpovědnosti</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Aplikace je poskytována "tak, jak je". Provozovatel nenese odpovědnost za přesnost dat vložených uživateli, funkčnost sledování polohy ani za případné škody vzniklé používáním aplikace. Tato aplikace není oficiální aplikací značky/kanálu Bez Komprese.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Sledování polohy (Tracker)</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Uživatel bere na vědomí, že zapnutím funkce Tracker sdílí svou polohu s ostatními uživateli. Doporučujeme nastavit si "Privacy Zone" v profilu pro ochranu soukromého bydliště. Používání této funkce je na vlastní nebezpečí.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Změny podmínek</h2>
                    <p className="text-zinc-400 leading-relaxed">
                        Tyto podmínky můžeme kdykoli aktualizovat. O významných změnách budeme uživatele informovat v rámci aplikace.
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
