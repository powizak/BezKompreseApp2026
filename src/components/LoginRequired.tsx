import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface LoginRequiredProps {
    title: string;
    message: string;
    icon: LucideIcon;
}

export default function LoginRequired({ title, message, icon: Icon }: LoginRequiredProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                <Icon size={48} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-3">{title}</h2>
            <p className="text-slate-500 mb-8 max-w-sm font-medium leading-relaxed">{message}</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                    to="/login"
                    className="bg-brand text-slate-900 font-black uppercase tracking-wider py-4 px-8 rounded-xl shadow-lg hover:bg-brand-dark hover:shadow-brand/20 transition-all transform hover:scale-105 active:scale-95 text-center"
                >
                    Přihlásit se
                </Link>
                <Link
                    to="/login?mode=register"
                    className="bg-white text-slate-900 border-2 border-slate-100 font-bold uppercase tracking-wider py-4 px-8 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-center"
                >
                    Registrovat
                </Link>
            </div>
        </div>
    );
}
