import { useEffect, useState, useMemo } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { Car } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoginRequired from '../components/LoginRequired';
import { Link } from 'react-router-dom';
import { CarFront, Filter, X, Search, Calendar, Gauge } from 'lucide-react';

export default function CarsPage() {
    const { user } = useAuth();
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [filters, setFilters] = useState({
        make: '',
        model: '',
        engine: ''
    });

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const loadCars = async () => {
            const fetchedCars = await Effect.runPromise(dataService.getAllCars(100)); // Fetch up to 100 cars
            setCars(fetchedCars);
            setLoading(false);
        };
        loadCars();
    }, [user]);

    // Extract unique filter options based on available data
    const filterOptions = useMemo(() => {
        const makes = Array.from(new Set(cars.map(c => c.make).filter(Boolean))).sort();
        const models = Array.from(new Set(cars.map(c => c.model).filter(Boolean))).sort();
        // For engines, it might be too diverse, but let's try
        const engines = Array.from(new Set(cars.map(c => c.engine).filter(Boolean))).sort();

        return { makes, models, engines };
    }, [cars]);

    // Apply filters
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            if (filters.make && car.make !== filters.make) return false;
            if (filters.model && car.model !== filters.model) return false;
            if (filters.engine && car.engine !== filters.engine) return false;
            return true;
        });
    }, [cars, filters]);

    const resetFilters = () => setFilters({ make: '', model: '', engine: '' });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <LoginRequired
                title="Prohlížení aut je zamčené"
                message="Pro zobrazení garáží ostatních uživatelů se musíte přihlásit."
                icon={CarFront}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Všechna Auta</h1>
                    <p className="text-slate-500 font-medium">Procházejte garáže ostatních uživatelů</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider mr-2">
                    <Filter size={16} /> Filtry
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-brand focus:border-brand block w-full p-2.5 outline-none font-medium"
                        value={filters.make}
                        onChange={e => setFilters(prev => ({ ...prev, make: e.target.value, model: '' }))} // Reset model when make changes
                    >
                        <option value="">Všechny značky</option>
                        {filterOptions.makes.map(make => (
                            <option key={make} value={make}>{make}</option>
                        ))}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-brand focus:border-brand block w-full p-2.5 outline-none font-medium"
                        value={filters.model}
                        onChange={e => setFilters(prev => ({ ...prev, model: e.target.value }))}
                        disabled={!filters.make && filterOptions.makes.length > 0} // Optional UX choice
                    >
                        <option value="">Všechny modely</option>
                        {filterOptions.models.filter(m => !filters.make || cars.some(c => c.make === filters.make && c.model === m)).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-brand focus:border-brand block w-full p-2.5 outline-none font-medium"
                        value={filters.engine}
                        onChange={e => setFilters(prev => ({ ...prev, engine: e.target.value }))}
                    >
                        <option value="">Všechny motorizace</option>
                        {filterOptions.engines.map(engine => (
                            <option key={engine} value={engine}>{engine}</option>
                        ))}
                    </select>
                </div>

                {(filters.make || filters.model || filters.engine) && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-wide whitespace-nowrap px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X size={14} /> Zrušit
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.length > 0 ? (
                    filteredCars.map(car => (
                        <Link to={`/car/${car.id}`} key={car.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 block">
                            {/* Image */}
                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                {car.photos && car.photos.length > 0 ? (
                                    <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                        <CarFront size={48} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                <div className="absolute bottom-0 left-0 p-4 text-white">
                                    <h3 className="font-black text-xl tracking-tight leading-none mb-1">{car.name}</h3>
                                    <p className="text-sm font-medium opacity-90">{car.make} {car.model}</p>
                                </div>

                                {/* Ownership Badge */}
                                {(car.isOwned ?? true) && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className="bg-brand text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-brand-light flex items-center gap-1">
                                            V garáži
                                        </span>
                                    </div>
                                )}
                                {!(car.isOwned ?? true) && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 opacity-90">
                                            Historie
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4 flex justify-between items-center text-slate-600 text-sm">
                                <span className="flex items-center gap-1 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <Calendar size={14} className="text-brand" /> {car.year}
                                </span>
                                <span className="flex items-center gap-1 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <Gauge size={14} className="text-brand" /> {car.power} kW
                                </span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} />
                        </div>
                        <p className="font-medium">Nenašli jsme žádná auta odpovídající filtrům.</p>
                        <button onClick={resetFilters} className="text-brand font-bold mt-2 hover:underline">Zrušit filtry</button>
                    </div>
                )}
            </div>
        </div>
    );
}
