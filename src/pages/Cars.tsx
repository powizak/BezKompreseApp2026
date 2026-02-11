import { useEffect, useState } from 'react';
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

    const [filterOptions, setFilterOptions] = useState<{ makes: string[], models: string[], engines: string[] }>({
        makes: [],
        models: [],
        engines: []
    });

    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );

    // Initial load of filter options
    useEffect(() => {
        if (!user) return;

        const loadOptions = async () => {
            const options = await Effect.runPromise(dataService.getFilterOptions());
            setFilterOptions(options);
        };
        loadOptions();
    }, [user]);

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

        // Debounce slightly to prevent rapid firing if user clicks fast, 
        // though for selects it's less critical than text inputs.
        const timer = setTimeout(loadCars, 100);
        return () => clearTimeout(timer);
    }, [user, filters]);

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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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
                        disabled={!filters.make}
                    >
                        <option value="">Všechny modely</option>
                        {filterOptions.models
                            // Optimistically filter models client-side if we have a make selected, 
                            // though strict server filtering will happen on fetch.
                            // Since we fetch "all" options upfront, this simple filter helps UX.
                            // However, we need to match the logic of "what models belong to this make".
                            // The getFilterOptions returns ALL models. 
                            // To properly filter models by make in the dropdown WITHOUT fetching again,
                            // we would need a map of make->models. 
                            // Current implementation of getFilterOptions just returns flat lists.
                            // So here we show ALL models unless we improve getFilterOptions.
                            // BUT, for now, let's keep it simple: show all, or if the user wants true dependent dropdowns,
                            // we'd need to fetch filter options differently.
                            // Given the prompt "make it possible to load all cars gradually", 
                            // let's stick to the requested behavior. 
                            // To improve UX, we can filter the models list based on the loaded cars IF we had them all,
                            // but we don't. 
                            // SO: We will show ALL models in the list (or we could improve getFilterOptions to return a tree).
                            // For this iteration, let's show all models, but maybe filtered by what we know? 
                            // No, showing all is safer than showing none.
                            .map(model => (
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

                                {/* For Sale Badge */}
                                {car.forSale && (
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1">
                                            <Tag size={12} />
                                            Na prodej
                                        </span>
                                    </div>
                                )}

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

                                {/* Vehicle Status Badge */}
                                {car.status && (
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow border flex items-center gap-1 ${VEHICLE_STATUS_CONFIG[car.status].color.bg} ${VEHICLE_STATUS_CONFIG[car.status].color.text} ${VEHICLE_STATUS_CONFIG[car.status].color.border}`}>
                                            {VEHICLE_STATUS_CONFIG[car.status].label}
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
