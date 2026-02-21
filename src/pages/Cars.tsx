import { useEffect, useMemo, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import type { Car } from '../types';
import { VEHICLE_STATUS_CONFIG } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../lib/imageService';
import LoginRequired from '../components/LoginRequired';
import { Link } from 'react-router-dom';
import { CarFront, Filter, X, Search, Calendar, Gauge, Tag } from 'lucide-react';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';

export default function CarsPage() {
    const { user } = useAuth();
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    // Filters State
    const [filters, setFilters] = useState({
        make: '',
        model: '',
        engine: ''
    });

    // Relational filter map: { make: { model: [engines] } }
    const [filterMap, setFilterMap] = useState<Record<string, Record<string, string[]>>>({});

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    // Initial load of filter map
    useEffect(() => {
        if (!user) return;

        const loadOptions = async () => {
            const options = await Effect.runPromise(dataService.getFilterOptions());
            setFilterMap(options.filterMap);
        };
        loadOptions();
    }, [user]);

    // Derive cascading filter options from the map
    const availableMakes = useMemo(() =>
        Object.keys(filterMap).sort(),
        [filterMap]);

    const availableModels = useMemo(() => {
        if (filters.make) {
            return Object.keys(filterMap[filters.make] || {}).sort();
        }
        // No make selected → all models across all makes
        const allModels = new Set<string>();
        for (const makeModels of Object.values(filterMap)) {
            for (const model of Object.keys(makeModels)) {
                allModels.add(model);
            }
        }
        return Array.from(allModels).sort();
    }, [filterMap, filters.make]);

    const availableEngines = useMemo(() => {
        const engines = new Set<string>();

        if (filters.make && filters.model) {
            // Both make and model selected → engines for that combo
            const modelEngines = filterMap[filters.make]?.[filters.model] || [];
            modelEngines.forEach(e => engines.add(e));
        } else if (filters.make) {
            // Only make selected → all engines across make's models
            const makeModels = filterMap[filters.make] || {};
            for (const modelEngines of Object.values(makeModels)) {
                modelEngines.forEach(e => engines.add(e));
            }
        } else if (filters.model) {
            // Only model selected → engines across all makes for this model
            for (const makeModels of Object.values(filterMap)) {
                if (makeModels[filters.model]) {
                    makeModels[filters.model].forEach(e => engines.add(e));
                }
            }
        } else {
            // Nothing selected → all engines
            for (const makeModels of Object.values(filterMap)) {
                for (const modelEngines of Object.values(makeModels)) {
                    modelEngines.forEach(e => engines.add(e));
                }
            }
        }

        return Array.from(engines).sort();
    }, [filterMap, filters.make, filters.model]);

    // Load cars when filters change or on initial load
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadCars = async () => {
            setLoading(true);
            try {
                const result = await Effect.runPromise(
                    dataService.getCarsPaginated(18, null, filters)
                );
                setCars(result.cars);
                setLastVisible(result.lastVisible);
                setHasMore(result.cars.length === 18);
            } catch (error) {
                console.error("Failed to load cars:", error);
            } finally {
                setLoading(false);
            }
        };

        // Debouce loading to prevent too many requests
        const timer = setTimeout(loadCars, 100);
        return () => clearTimeout(timer);
    }, [user?.uid, filters]);

    const loadMore = async () => {
        if (!lastVisible || loadingMore) return;

        setLoadingMore(true);
        try {
            const result = await Effect.runPromise(
                dataService.getCarsPaginated(18, lastVisible, filters)
            );

            setCars(prev => [...prev, ...result.cars]);
            setLastVisible(result.lastVisible);
            setHasMore(result.cars.length === 18);
        } catch (error) {
            console.error("Failed to load more cars:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const resetFilters = () => setFilters({ make: '', model: '', engine: '' });

    if (loading && cars.length === 0) {
        return <LoadingState message="Načítám auta..." className="py-20" />;
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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="p-2 bg-brand text-brand-contrast rounded-xl shadow-lg shadow-brand/20">
                    <CarFront size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter">Všechna Auta</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Procházejte garáže ostatních uživatelů</p>
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
                        onChange={e => setFilters({ make: e.target.value, model: '', engine: '' })}
                    >
                        <option value="">Všechny značky</option>
                        {availableMakes.map(make => (
                            <option key={make} value={make}>{make}</option>
                        ))}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-brand focus:border-brand block w-full p-2.5 outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        value={filters.model}
                        onChange={e => setFilters(prev => ({ ...prev, model: e.target.value, engine: '' }))}
                        disabled={!filters.make}
                    >
                        <option value="">Všechny modely</option>
                        {availableModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>

                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-brand focus:border-brand block w-full p-2.5 outline-none font-medium"
                        value={filters.engine}
                        onChange={e => setFilters(prev => ({ ...prev, engine: e.target.value }))}
                    >
                        <option value="">Všechny motorizace</option>
                        {availableEngines.map(engine => (
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
                {cars.length > 0 ? (
                    cars.map(car => (
                        <Link to={`/car/${car.id}`} key={car.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 block">
                            {/* Image */}
                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                {car.photos && car.photos.length > 0 ? (
                                    <CachedImage src={getImageUrl(car.photos[0], 'thumb')} alt={car.name} priority={true} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

                                {/* Badges Stack */}
                                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start">
                                    {/* Ownership Badge */}
                                    {(car.isOwned ?? true) ? (
                                        <div className="bg-brand text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-brand-light flex items-center gap-1">
                                            V garáži
                                        </div>
                                    ) : (
                                        <div className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 opacity-90">
                                            Historie
                                        </div>
                                    )}

                                    {/* For Sale Badge */}
                                    {car.forSale && (
                                        <div className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                            <Tag size={12} />
                                            Na prodej
                                        </div>
                                    )}

                                    {/* Vehicle Status Badge */}
                                    {car.status && (
                                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow border flex items-center gap-1 ${VEHICLE_STATUS_CONFIG[car.status].color.bg} ${VEHICLE_STATUS_CONFIG[car.status].color.text} ${VEHICLE_STATUS_CONFIG[car.status].color.border}`}>
                                            {VEHICLE_STATUS_CONFIG[car.status].label}
                                        </div>
                                    )}
                                </div>
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
                    !loading && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={32} />
                            </div>
                            <p className="font-medium">Nenašli jsme žádná auta odpovídající filtrům.</p>
                            <button onClick={resetFilters} className="text-brand font-bold mt-2 hover:underline">Zrušit filtry</button>
                        </div>
                    )
                )}
            </div>

            {/* Load More Button */}
            {hasMore && cars.length > 0 && (
                <div className="flex justify-center pt-8">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loadingMore ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                                Načítám...
                            </>
                        ) : (
                            <>
                                Načíst další
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
