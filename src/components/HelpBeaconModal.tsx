import { useState } from 'react';
import { X, Wrench, Fuel, AlertTriangle, CircleSlash, HelpCircle } from 'lucide-react';
import type { BeaconType } from '../types';

interface HelpBeaconModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (beaconType: BeaconType, description?: string) => void;
    isLoading: boolean;
}

const BEACON_TYPES: { type: BeaconType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'breakdown', label: 'Porucha', icon: <Wrench size={24} />, color: 'bg-orange-500' },
    { type: 'empty_tank', label: 'Prázdná nádrž', icon: <Fuel size={24} />, color: 'bg-amber-500' },
    { type: 'accident', label: 'Nehoda', icon: <AlertTriangle size={24} />, color: 'bg-red-600' },
    { type: 'flat_tire', label: 'Defekt', icon: <CircleSlash size={24} />, color: 'bg-slate-600' },
    { type: 'other', label: 'Jiné', icon: <HelpCircle size={24} />, color: 'bg-blue-500' },
];

export default function HelpBeaconModal({ isOpen, onClose, onSubmit, isLoading }: HelpBeaconModalProps) {
    const [selectedType, setSelectedType] = useState<BeaconType | null>(null);
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedType) return;
        onSubmit(selectedType, description || undefined);
    };

    const handleClose = () => {
        setSelectedType(null);
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight">🆘 S.O.S. Beacon</h2>
                    <p className="text-sm text-white/80 mt-1">Potřebuješ pomoc? Vyber typ problému.</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Beacon type selection */}
                    <div className="grid grid-cols-2 gap-3">
                        {BEACON_TYPES.map(({ type, label, icon, color }) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedType === type
                                        ? `${color} text-white border-transparent shadow-lg scale-105`
                                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {icon}
                                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Popis (volitelné)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Např. stojím u silnice č. 35, potřebuji startovací kabely..."
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none resize-none text-sm"
                            rows={3}
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedType || isLoading}
                        className={`w-full py-4 rounded-2xl font-black italic uppercase tracking-tight text-lg transition-all ${selectedType && !isLoading
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Odesílám...' : '🆘 Odeslat S.O.S.'}
                    </button>

                    <p className="text-xs text-slate-400 text-center">
                        Tvoje poloha bude sdílena s uživateli do 50 km.
                    </p>
                </div>
            </div>
        </div>
    );
}
