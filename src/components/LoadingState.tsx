import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export default function LoadingState({ message = "Načítám data...", className }: LoadingStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-300", className)}>
            <div className="relative w-24 h-24 mb-6">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full" />

                {/* Rotating Logo */}
                <img
                    src="/logo_120.webp"
                    alt="Loading..."
                    className="w-full h-full object-contain animate-[spin_3s_linear_infinite]"
                />
            </div>

            {/* Pulsing Text */}
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">
                {message}
            </p>
        </div>
    );
}
