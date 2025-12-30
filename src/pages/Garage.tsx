import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { Car } from '../types';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Garage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', make: '', model: '', year: new Date().getFullYear().toString(), engine: '', power: '' });

  useEffect(() => {
    if (user) {
        fetchCars();
    } else {
        setLoading(false);
    }
  }, [user]);

  const fetchCars = () => {
    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );
    if (!user) return;
    
    Effect.runPromise(dataService.getMyCars(user.uid)).then(data => {
        setCars(data);
        setLoading(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const dataService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(DataService);
        }).pipe(Effect.provide(DataServiceLive))
    );
    const newCar = {
        ownerId: user.uid,
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        engine: formData.engine,
        power: formData.power,
        mods: []
    };

    await Effect.runPromise(dataService.addCar(newCar));
    setShowForm(false);
    fetchCars(); // Reload
  };

  if (!user) return (
      <div className="text-center py-10">
          <p className="mb-4">Pro zobrazení garáže se musíte přihlásit.</p>
          <Link to="/login" className="text-brand font-bold underline">Přihlásit se</Link>
      </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Moje Garáž</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand text-white p-2 rounded-full shadow-lg hover:bg-brand-dark">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold mb-4">Přidat auto</h3>
            <div className="grid grid-cols-2 gap-4">
                <input placeholder="Přezdívka (např. Daily)" className="border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <input placeholder="Značka (např. Škoda)" className="border p-2 rounded" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} required />
                <input placeholder="Model" className="border p-2 rounded" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
                <input placeholder="Rok výroby" type="number" className="border p-2 rounded" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
                <input placeholder="Motor" className="border p-2 rounded" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} required />
                <input placeholder="Výkon" className="border p-2 rounded" value={formData.power} onChange={e => setFormData({...formData, power: e.target.value})} required />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg mt-4">Uložit do garáže</button>
        </form>
      )}

      {loading ? <p>Načítám...</p> : (
        <div className="space-y-4">
          {cars.map(car => (
            <div key={car.id} className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-brand">
              <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl">{car.name}</h3>
                        <p className="text-slate-500">{car.make} {car.model} ({car.year})</p>
                    </div>
                    <div className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold">{car.power}</div>
                </div>
                <div className="mt-3 flex gap-2 text-sm text-slate-600">
                    <span>{car.engine}</span>
                    <span>•</span>
                    <span>{car.mods.length} úprav</span>
                </div>
              </div>
            </div>
          ))}
          {cars.length === 0 && !showForm && (
              <div className="text-center py-10 text-slate-400">
                  Zatím tu nic neparkuje.
              </div>
          )}
        </div>
      )}
    </div>
  );
}
