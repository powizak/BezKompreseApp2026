import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { Car, FuelRecord } from '../types';
import {
    ArrowLeft, Droplets, DollarSign,
    Trash2, Pencil, X, AlertCircle, TrendingUp,
    Fuel
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function FuelTracker() {
    const { carId } = useParams<{ carId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [car, setCar] = useState<Car | null>(null);
    const [records, setRecords] = useState<FuelRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        mileage: '',
        liters: '',
        pricePerLiter: '',
        totalPrice: '',
        fullTank: true,
        station: '',
        notes: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!carId || !user) {
            navigate('/garage');
            return;
        }
        fetchData();
    }, [carId, user]);

    const fetchData = async () => {
        if (!carId) return;

        try {
            const [carData, recordsData] = await Promise.all([
                Effect.runPromise(dataService.getCarById(carId)),
                Effect.runPromise(dataService.getFuelRecords(carId))
            ]);

            if (!carData || carData.ownerId !== user?.uid) {
                navigate('/garage');
                return;
            }

            setCar(carData);
            setRecords(recordsData);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Nepodařilo se načíst data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record: FuelRecord) => {
        setEditingRecord(record);
        setFormData({
            date: record.date.split('T')[0],
            mileage: record.mileage.toString(),
            liters: record.liters.toString(),
            pricePerLiter: record.pricePerLiter.toString(),
            totalPrice: record.totalPrice.toString(),
            fullTank: record.fullTank,
            station: record.station || '',
            notes: record.notes || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (recordId: string) => {
        if (!confirm('Opravdu chcete smazat tento záznam?')) return;

        try {
            await Effect.runPromise(dataService.deleteFuelRecord(recordId));
            fetchData();
        } catch (err) {
            console.error('Failed to delete record', err);
            alert('Nepodařilo se smazat záznam');
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingRecord(null);
        setShowForm(false);
        setError(null);
    };

    const calculateConsumption = (current: any, previous: FuelRecord | undefined) => {
        if (!previous || !current.fullTank || !previous.fullTank) return undefined;
        const dist = current.mileage - previous.mileage;
        if (dist <= 0) return undefined;
        return (current.liters / dist) * 100;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !carId) return;

        setUploading(true);
        setError(null);

        try {
            const mileageNum = parseInt(formData.mileage);
            const litersNum = parseFloat(formData.liters);
            const totalPriceNum = parseFloat(formData.totalPrice);
            const pricePerLiterNum = parseFloat(formData.pricePerLiter);

            // Find previous record for consumption calc
            // Records are sorted by date desc
            const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const prevRecord = sortedRecords.filter(r => new Date(r.date).getTime() < new Date(formData.date).getTime()).pop();

            const consumption = calculateConsumption({ mileage: mileageNum, liters: litersNum, fullTank: formData.fullTank }, prevRecord);
            const distanceDelta = prevRecord ? mileageNum - prevRecord.mileage : undefined;

            const recordData: any = {
                carId,
                ownerId: user.uid,
                date: new Date(formData.date).toISOString(),
                mileage: mileageNum,
                liters: litersNum,
                pricePerLiter: pricePerLiterNum,
                totalPrice: totalPriceNum,
                fullTank: formData.fullTank,
                station: formData.station || "",
                notes: formData.notes || "",
                consumption: consumption ?? null,
                distanceDelta: distanceDelta ?? null
            };

            if (editingRecord) {
                await Effect.runPromise(dataService.updateFuelRecord(editingRecord.id, recordData));
            } else {
                await Effect.runPromise(dataService.addFuelRecord(recordData));
            }

            resetForm();
            fetchData();
        } catch (err) {
            console.error('Save failed', err);
            setError('Uložení selhalo. Zkuste to prosím znovu.');
        } finally {
            setUploading(false);
        }
    };

    // Calculate stats
    const totalSpent = records.reduce((sum, r) => sum + r.totalPrice, 0);
    const totalLiters = records.reduce((sum, r) => sum + r.liters, 0);

    // Avg consumption from records that have it
    const validConsumptions = records.filter(r => r.consumption !== undefined && r.consumption !== null);
    const avgConsumption = validConsumptions.length > 0
        ? validConsumptions.reduce((sum, r) => sum + (r.consumption || 0), 0) / validConsumptions.length
        : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (!car) return null;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <Link to="/garage" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 font-medium">
                    <ArrowLeft size={20} />
                    Zpět do garáže
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-1">
                            Tankování a Spotřeba
                        </h1>
                        <p className="text-lg font-bold text-slate-600">{car.name} - {car.make} {car.model}</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="bg-brand text-slate-900 p-3 px-5 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark hover:shadow-brand/40 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Fuel size={24} strokeWidth={2.5} />
                        <span className="font-bold">Přidat tankování</span>
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-brand/10 p-2 rounded-lg">
                            <Droplets className="text-brand" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Průměrná spotřeba</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">
                        {avgConsumption > 0 ? avgConsumption.toFixed(2).replace('.', ',') : '--'} <span className="text-sm">l/100km</span>
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <DollarSign className="text-green-500" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celkem utraceno</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalSpent.toLocaleString()} Kč</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <TrendingUp className="text-blue-500" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celkem litrů</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalLiters.toLocaleString()} l</p>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Fuel size={18} />
                                {editingRecord ? 'Upravit tankování' : 'Nové tankování'}
                            </h3>
                            <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
                                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tachometr (km)</label>
                                    <input
                                        type="number"
                                        placeholder="125400"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all"
                                        value={formData.mileage}
                                        onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Litrů</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="45.50"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all"
                                        value={formData.liters}
                                        onChange={e => {
                                            const liters = e.target.value;
                                            const total = formData.pricePerLiter ? (parseFloat(liters) * parseFloat(formData.pricePerLiter)).toFixed(2) : formData.totalPrice;
                                            setFormData({ ...formData, liters, totalPrice: total });
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cena za litr (Kč)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="36.90"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all"
                                        value={formData.pricePerLiter}
                                        onChange={e => {
                                            const price = e.target.value;
                                            const total = formData.liters ? (parseFloat(price) * parseFloat(formData.liters)).toFixed(2) : formData.totalPrice;
                                            setFormData({ ...formData, pricePerLiter: price, totalPrice: total });
                                        }}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Celková cena (Kč)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all font-bold"
                                        value={formData.totalPrice}
                                        onChange={e => setFormData({ ...formData, totalPrice: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <input
                                        type="checkbox"
                                        id="fullTank"
                                        className="w-5 h-5 accent-brand"
                                        checked={formData.fullTank}
                                        onChange={e => setFormData({ ...formData, fullTank: e.target.checked })}
                                    />
                                    <label htmlFor="fullTank" className="text-sm font-bold text-slate-700 cursor-pointer">Plná nádrž (důležité pro výpočet spotřeby)</label>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Čerpací stanice (volitelné)</label>
                                    <input
                                        placeholder="Benzina, Shell..."
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand transition-all"
                                        value={formData.station}
                                        onChange={e => setFormData({ ...formData, station: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className={`w-full text-slate-900 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${uploading ? 'bg-slate-400 cursor-wait text-white' : 'bg-brand hover:bg-brand-dark shadow-brand/20'}`}
                            >
                                {uploading ? 'Ukládám...' : editingRecord ? 'Uložit změny' : 'Uložit tankování'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                        Historie tankování
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-6 py-4">Datum</th>
                                <th className="px-6 py-4">Tachometr</th>
                                <th className="px-6 py-4">Litrů</th>
                                <th className="px-6 py-4">Cena/L</th>
                                <th className="px-6 py-4">Celkem</th>
                                <th className="px-6 py-4">Spotřeba</th>
                                <th className="px-6 py-4 text-right">Akce</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <p className="text-slate-400 font-medium">Zatím žádné záznamy o tankování.</p>
                                    </td>
                                </tr>
                            ) : (
                                records.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{format(new Date(record.date), 'd. M. yyyy', { locale: cs })}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{record.station || 'Nezadáno'}</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            {record.mileage.toLocaleString()} km
                                            {record.distanceDelta && <span className="block text-[10px] text-brand">+{record.distanceDelta} km</span>}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{record.liters.toFixed(2)} l</td>
                                        <td className="px-6 py-4 text-slate-600">{record.pricePerLiter.toFixed(2)} Kč</td>
                                        <td className="px-6 py-4 font-black text-slate-900">{record.totalPrice.toLocaleString()} Kč</td>
                                        <td className="px-6 py-4">
                                            {record.consumption ? (
                                                <span className="bg-brand/10 text-brand px-2 py-1 rounded-lg text-xs font-black">
                                                    {record.consumption.toFixed(2).replace('.', ',')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(record)} className="p-2 text-slate-400 hover:text-slate-600 bg-white shadow-sm rounded-lg border border-slate-100">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(record.id)} className="p-2 text-red-400 hover:text-red-600 bg-white shadow-sm rounded-lg border border-slate-100">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
