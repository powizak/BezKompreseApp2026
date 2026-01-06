import { Youtube, Car } from 'lucide-react';

export default function SupportSection() {
    return (
        <section className="bg-[#111111] p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden group mt-12 mb-8">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                    <h3 className="font-black text-2xl mb-2 text-brand uppercase italic tracking-wide">Podpořte nás</h3>
                    <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                        Líbí se vám naše tvorba? Kupte si něco pěkného v e-shopu nebo se staňte členem a podpořte vznik dalších videí.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <a href="https://bezkompreseshop.cz" target="_blank" rel="noopener noreferrer" className="bg-brand text-brand-contrast font-black uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-white hover:text-black transition-colors shadow-[0_0_20px_rgba(255,214,0,0.2)] text-center text-sm">
                        E-shop
                    </a>
                    <a href="https://www.youtube.com/channel/UCw7nrQwqRDvG6Q3CSEmcOSw/join" target="_blank" rel="noopener noreferrer" className="bg-[#FF0000] text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl hover:bg-white hover:text-[#FF0000] transition-colors shadow-lg shadow-black/20 text-center text-sm flex items-center justify-center gap-2">
                        <Youtube size={18} className="fill-current" /> Členství
                    </a>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-12 -bottom-12 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity duration-500">
                <Car size={250} />
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand/10 to-transparent"></div>
        </section>
    );
}
