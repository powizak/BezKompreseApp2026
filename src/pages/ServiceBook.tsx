import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { Car, ServiceRecord, ServicePart } from '../types';
import {
    ArrowLeft, Plus, Gauge, Wrench, DollarSign, MapPin,
    FileText, Trash2, Pencil, X, Save, AlertCircle, TrendingUp,
    Clock, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import LoadingState from '../components/LoadingState';

const SERVICE_TEMPLATES = [
    { category: 'oil', title: 'Výměna oleje + filtry', interval: 10000, type: 'scheduled' },
    { category: 'brakes', title: 'Výměna brzd', interval: 30000, type: 'scheduled' },
    { category: 'tires', title: 'Výměna pneumatik', interval: 40000, type: 'scheduled' },
    { category: 'timing', title: 'Rozvodový řemen', interval: 120000, type: 'scheduled' },
    { category: 'filters', title: 'Kabinový filtr', interval: 15000, type: 'scheduled' },
] as const;

export default function ServiceBook() {
    const { carId } = useParams<{ carId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [car, setCar] = useState<Car | null>(null);
    const [records, setRecords] = useState<ServiceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        mileage: '',
        type: 'scheduled' as ServiceRecord['type'],
        category: 'oil' as ServiceRecord['category'],
        title: '',
        description: '',
        parts: [] as ServicePart[],
        laborCost: '',
        partsCost: '',
        totalCost: '',
        serviceProvider: '',
        nextServiceMileage: '',
        nextServiceDate: '',
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
                Effect.runPromise(dataService.getServiceRecords(carId, user?.uid))
            ]);

            if (!carData) {
                navigate('/garage');
                return;
            }

            if (carData.ownerId !== user?.uid) {
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

    const handleTemplateSelect = (template: typeof SERVICE_TEMPLATES[number]) => {
        setFormData({
            ...formData,
            category: template.category,
            title: template.title,
            type: template.type,
            nextServiceMileage: formData.mileage ? (parseInt(formData.mileage) + template.interval).toString() : '',
        });
    };

    const addPart = () => {
        setFormData({
            ...formData,
            parts: [...formData.parts, { name: '', quantity: 1 }]
        });
    };

    const updatePart = (index: number, field: keyof ServicePart, value: any) => {
        const newParts = [...formData.parts];
        newParts[index] = { ...newParts[index], [field]: value };
        setFormData({ ...formData, parts: newParts });
    };

    const removePart = (index: number) => {
        setFormData({
            ...formData,
            parts: formData.parts.filter((_, i) => i !== index)
        });
    };

    const handleEdit = (record: ServiceRecord) => {
        setEditingRecord(record);
        setFormData({
            date: record.date.split('T')[0],
            mileage: record.mileage.toString(),
            type: record.type,
            category: record.category,
            title: record.title,
            description: record.description || '',
            parts: record.parts || [],
            laborCost: record.laborCost?.toString() || '',
            partsCost: record.partsCost?.toString() || '',
            totalCost: record.totalCost.toString(),
            serviceProvider: record.serviceProvider || '',
            nextServiceMileage: record.nextServiceMileage?.toString() || '',
            nextServiceDate: record.nextServiceDate?.split('T')[0] || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (recordId: string) => {
        if (!confirm('Opravdu chcete smazat tento záznam?')) return;

        try {
            await Effect.runPromise(dataService.deleteServiceRecord(recordId));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !carId) return;

        setUploading(true);
        setError(null);

        try {
            const recordData: any = {
                carId,
                ownerId: user.uid,
                date: new Date(formData.date).toISOString(),
                mileage: parseInt(formData.mileage),
                type: formData.type,
                category: formData.category,
                title: formData.title,
                totalCost: parseFloat(formData.totalCost),
            };

            // Add optional fields only if they have values (Firestore doesn't accept undefined)
            if (formData.description) recordData.description = formData.description;
            if (formData.parts.length > 0) recordData.parts = formData.parts;
            if (formData.laborCost) recordData.laborCost = parseFloat(formData.laborCost);
            if (formData.partsCost) recordData.partsCost = parseFloat(formData.partsCost);
            if (formData.serviceProvider) recordData.serviceProvider = formData.serviceProvider;
            if (formData.nextServiceMileage) recordData.nextServiceMileage = parseInt(formData.nextServiceMileage);
            if (formData.nextServiceDate) recordData.nextServiceDate = new Date(formData.nextServiceDate).toISOString();

            if (editingRecord) {
                await Effect.runPromise(dataService.updateServiceRecord(editingRecord.id, recordData));
            } else {
                await Effect.runPromise(dataService.addServiceRecord(recordData));
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

    // Calculate total costs
    const totalCosts = records.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCostPerMonth = car ? totalCosts / Math.max(1, Math.floor((Date.now() - new Date(car.year, 0, 1).getTime()) / (30 * 24 * 60 * 60 * 1000))) : 0;

    // Get upcoming services
    const upcomingServices = records.filter(r => r.nextServiceMileage || r.nextServiceDate);

    if (loading) {
        return (
            <LoadingState message="Načítám servisní knížku..." className="py-20 min-h-[50vh]" />
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
                            Servisní knížka
                        </h1>
                        <p className="text-lg font-bold text-slate-600">{car.name} - {car.make} {car.model}</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="bg-brand text-slate-900 p-3 px-5 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark hover:shadow-brand/40 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                        <span className="font-bold">Přidat záznam</span>
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-brand/10 p-2 rounded-lg">
                            <FileText className="text-brand" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celkem záznamů</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{records.length}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-50 p-2 rounded-lg">
                            <DollarSign className="text-red-500" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celkové náklady</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{totalCosts.toLocaleString()} Kč</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <TrendingUp className="text-blue-500" size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Průměr/měsíc</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{Math.round(avgCostPerMonth).toLocaleString()} Kč</p>
                </div>
            </div>

            {/* Upcoming Services */}
            {upcomingServices.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
                    <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                        <Clock size={18} />
                        Nadcházející servis
                    </h3>
                    <div className="space-y-2">
                        {upcomingServices.slice(0, 3).map(record => (
                            <div key={record.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-amber-800">{record.title}</span>
                                <span className="text-amber-600">
                                    {record.nextServiceMileage && `Za ${record.nextServiceMileage.toLocaleString()} km`}
                                    {record.nextServiceDate && ` / ${format(new Date(record.nextServiceDate), 'd. M. yyyy', { locale: cs })}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {editingRecord ? <Pencil size={18} /> : <Plus size={18} />}
                                {editingRecord ? 'Upravit záznam' : 'Nový servisní záznam'}
                            </h3>
                            <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
                                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Templates */}
                            {!editingRecord && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rychlé šablony</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {SERVICE_TEMPLATES.map(template => (
                                            <button
                                                key={template.category}
                                                type="button"
                                                onClick={() => handleTemplateSelect(template)}
                                                className="text-xs bg-slate-100 hover:bg-brand hover:text-slate-900 text-slate-600 px-3 py-2 rounded-lg font-bold transition-colors"
                                            >
                                                {template.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Základní údaje</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nájezd (km)</label>
                                        <input
                                            type="number"
                                            placeholder="125000"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.mileage}
                                            onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        >
                                            <option value="scheduled">Plánovaný servis</option>
                                            <option value="repair">Oprava</option>
                                            <option value="upgrade">Úprava</option>
                                            <option value="inspection">Prohlídka</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        >
                                            <option value="oil">Olej</option>
                                            <option value="tires">Pneumatiky</option>
                                            <option value="brakes">Brzdy</option>
                                            <option value="filters">Filtry</option>
                                            <option value="timing">Rozvody</option>
                                            <option value="other">Ostatní</option>
                                        </select>
                                    </div>
                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Název práce</label>
                                        <input
                                            placeholder="např. Výměna oleje + filtry"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Popis (volitelné)</label>
                                        <textarea
                                            placeholder="Podrobnosti o provedeném servisu..."
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all resize-none h-20"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parts */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Použité díly</h4>
                                    <button type="button" onClick={addPart} className="text-xs font-bold text-brand flex items-center gap-1 hover:underline">
                                        <Plus size={14} />
                                        Přidat díl
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {formData.parts.map((part, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                placeholder="Název dílu"
                                                className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm focus:ring-1 focus:ring-brand outline-none"
                                                value={part.name}
                                                onChange={e => updatePart(i, 'name', e.target.value)}
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="Ks"
                                                className="w-20 bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm focus:ring-1 focus:ring-brand outline-none"
                                                value={part.quantity}
                                                onChange={e => updatePart(i, 'quantity', parseInt(e.target.value))}
                                                required
                                            />
                                            <button type="button" onClick={() => removePart(i)} className="text-slate-400 hover:text-red-500 p-1">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Costs */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Náklady</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Práce (Kč)</label>
                                        <input
                                            type="number"
                                            placeholder="800"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.laborCost}
                                            onChange={e => setFormData({ ...formData, laborCost: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Díly (Kč)</label>
                                        <input
                                            type="number"
                                            placeholder="400"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.partsCost}
                                            onChange={e => setFormData({ ...formData, partsCost: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Celkem (Kč)</label>
                                        <input
                                            type="number"
                                            placeholder="1200"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all font-bold"
                                            value={formData.totalCost}
                                            onChange={e => setFormData({ ...formData, totalCost: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Service Provider */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Servis</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kde provedeno</label>
                                    <input
                                        placeholder="Autoservis Novák / Doma"
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                        value={formData.serviceProvider}
                                        onChange={e => setFormData({ ...formData, serviceProvider: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Next Service */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Příští servis</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Za km</label>
                                        <input
                                            type="number"
                                            placeholder="135000"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.nextServiceMileage}
                                            onChange={e => setFormData({ ...formData, nextServiceMileage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nebo datum</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                            value={formData.nextServiceDate}
                                            onChange={e => setFormData({ ...formData, nextServiceDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`w-full text-slate-900 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${uploading ? 'bg-slate-400 cursor-wait text-white' : 'bg-brand hover:bg-brand-dark shadow-brand/20 hover:shadow-brand/40'
                                        }`}
                                >
                                    {uploading ? (
                                        <>Ukládám...</>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Uložit záznam
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Records Timeline */}
            <div className="space-y-4">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">
                    Historie servisu
                </h2>

                {records.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                        <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                            <Wrench size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Zatím žádné záznamy</h3>
                        <p className="text-slate-500 mb-6 max-w-xs mx-auto">Začněte sledovat servis svého auta</p>
                        <button onClick={() => setShowForm(true)} className="text-brand font-bold hover:underline">
                            + Přidat první záznam
                        </button>
                    </div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                            <div className="flex flex-col md:flex-row">
                                {/* Date Box */}
                                <div className="bg-slate-50 md:w-32 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        {format(new Date(record.date), 'MMM', { locale: cs })}
                                    </span>
                                    <span className="text-3xl font-black text-slate-900">
                                        {format(new Date(record.date), 'd', { locale: cs })}
                                    </span>
                                    <span className="text-sm font-bold text-slate-500 mt-1">
                                        {format(new Date(record.date), 'yyyy', { locale: cs })}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${record.type === 'scheduled' ? 'bg-green-100 text-green-700' :
                                                    record.type === 'repair' ? 'bg-red-100 text-red-700' :
                                                        record.type === 'upgrade' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {record.type === 'scheduled' ? 'Plánovaný' :
                                                        record.type === 'repair' ? 'Oprava' :
                                                            record.type === 'upgrade' ? 'Úprava' : 'Prohlídka'}
                                                </span>
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                                                    {record.category}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-xl mb-1">{record.title}</h3>
                                            {record.description && (
                                                <p className="text-slate-500 text-sm mb-2">{record.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(record)}
                                                className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Gauge size={16} className="text-slate-400" />
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Nájezd</p>
                                                <p className="font-bold">{record.mileage.toLocaleString()} km</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <DollarSign size={16} className="text-slate-400" />
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Cena</p>
                                                <p className="font-bold">{record.totalCost.toLocaleString()} Kč</p>
                                            </div>
                                        </div>
                                        {record.serviceProvider && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <MapPin size={16} className="text-slate-400" />
                                                <div>
                                                    <p className="text-slate-400 font-bold uppercase">Servis</p>
                                                    <p className="font-bold">{record.serviceProvider}</p>
                                                </div>
                                            </div>
                                        )}
                                        {record.parts && record.parts.length > 0 && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Package size={16} className="text-slate-400" />
                                                <div>
                                                    <p className="text-slate-400 font-bold uppercase">Díly</p>
                                                    <p className="font-bold">{record.parts.length}x</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
