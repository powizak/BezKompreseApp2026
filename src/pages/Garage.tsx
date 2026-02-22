import { useEffect, useState, useRef } from 'react';
import { Effect } from 'effect';
import { DataService, DataServiceLive } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';
import type { Car, CarModification, VehicleReminder, VehicleStatus, ImageVariants } from '../types';
import { VEHICLE_STATUS_CONFIG } from '../types';
import { Plus, Pencil, Trash2, Camera, CarFront, Gauge, Wrench, X, Save, AlertCircle, Fuel, FileCheck, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getImageUrl } from '../lib/imageService';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}


import LoginRequired from '../components/LoginRequired';
import VehicleRemindersEditor from '../components/VehicleRemindersEditor';
import CachedImage from '../components/CachedImage';
import LoadingState from '../components/LoadingState';

// Helper to determine worst reminder status for a car
function getReminderStatus(reminders?: VehicleReminder[]): 'green' | 'yellow' | 'red' | null {
  if (!reminders?.length) return null;
  const now = new Date();
  let hasYellow = false;

  for (const r of reminders) {
    if (!r.expirationDate) continue;
    const exp = new Date(r.expirationDate);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'red'; // Any expired = red immediately
    if (daysLeft <= 30) hasYellow = true;
  }
  return hasYellow ? 'yellow' : 'green';
}

export default function Garage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);

  // Form State
  const initialFormState = {
    name: '', make: '', model: '', year: new Date().getFullYear().toString(),
    engine: '', power: 0, stockPower: 0, fuelConsumption: '', mods: [] as CarModification[], photos: [] as (string | ImageVariants)[], isOwned: true,
    reminders: [] as VehicleReminder[],
    status: undefined as VehicleStatus | undefined,
    forSale: false, salePrice: '', saleDescription: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataService = Effect.runSync(
    Effect.gen(function* (_) {
      return yield* _(DataService);
    }).pipe(Effect.provide(DataServiceLive))
  );

  useEffect(() => {
    if (user) {
      fetchCars();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  const fetchCars = () => {
    if (!user) return;
    Effect.runPromise(dataService.getMyCars(user.uid)).then(data => {
      setCars(data);
      setLoading(false);
    });
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      make: car.make,
      model: car.model,
      year: car.year.toString(),
      engine: car.engine,
      power: car.power,
      stockPower: car.stockPower || 0,
      fuelConsumption: car.fuelConsumption || '',
      mods: car.mods || [],
      photos: car.photos || [],
      isOwned: car.isOwned ?? true,
      reminders: car.reminders || [],
      status: car.status,
      forSale: car.forSale ?? false,
      salePrice: car.salePrice?.toString() || '',
      saleDescription: car.saleDescription || ''
    });
    setShowForm(true);
    setSelectedFiles([]); // Reset new files
  };

  const handleDeleteClick = (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for car:', carId);
    setCarToDelete(carId);
  };

  const confirmDelete = async () => {
    if (!carToDelete) return;

    console.log('User confirmed deletion, proceeding...');

    try {
      // Optimistically update UI immediately
      console.log('Updating UI optimistically...');
      setCars(prevCars => {
        const filtered = prevCars.filter(car => car.id !== carToDelete);
        console.log('Cars after filter:', filtered.length, 'from', prevCars.length);
        return filtered;
      });

      // Close modal
      setCarToDelete(null);

      // Then delete from database
      console.log('Deleting from database...');
      await Effect.runPromise(dataService.deleteCar(carToDelete));
      console.log('Database deletion successful');

      // Optionally refresh to ensure sync (in case of errors)
      fetchCars();
    } catch (err) {
      console.error('Failed to delete car', err);
      alert('Nepodařilo se smazat auto. Zkuste to prosím znovu.');
      // Refresh to restore the correct state
      fetchCars();
    }
  };

  const cancelDelete = () => {
    console.log('User cancelled deletion');
    setCarToDelete(null);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingCar(null);
    setShowForm(false);
    setSelectedFiles([]);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (file.size > 15 * 1024 * 1024) {
          alert(`Fotka ${file.name} je příliš velká (max 15 MB).`);
          return false;
        }
        return true;
      });

      if (validFiles.length + formData.photos.length > 4) {
        alert("Maximálně 4 fotky na auto.");
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (photo: string | ImageVariants) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p !== photo) }));
  };

  const addMod = () => {
    const newMod: CarModification = {
      id: Date.now().toString(),
      name: '',
      type: 'performance',
      description: ''
    };
    setFormData(prev => ({ ...prev, mods: [...prev.mods, newMod] }));
  };

  const updateMod = (index: number, field: keyof CarModification, value: any) => {
    const newMods = [...formData.mods];
    newMods[index] = { ...newMods[index], [field]: value };
    setFormData(prev => ({ ...prev, mods: newMods }));
  };

  const removeMod = (index: number) => {
    setFormData(prev => ({ ...prev, mods: prev.mods.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    setError(null);



    try {
      // 1. Upload new photos (imageService now handles compression and variant generation)
      const newPhotoVariants: (string | ImageVariants)[] = [];
      // We need a temporary ID for new cars to folder structure, or just use timestamp
      const tempId = editingCar ? editingCar.id : `new_${Date.now()}`;



      for (const file of selectedFiles) {
        try {

          // No need to compress - imageService handles everything
          const variants = await Effect.runPromise(dataService.uploadCarPhoto(file, tempId));

          newPhotoVariants.push(variants);
        } catch (err) {
          console.error("[Garage] Upload failed", err);
          // We continue with other files or fail? Let's continue but warn
          setError("Některé fotky se nepodařilo nahrát. Zkontrolujte připojení nebo Storage.");
        }
      }



      const finalPhotos = [...formData.photos, ...newPhotoVariants];



      const carData = {
        ownerId: user.uid,
        name: formData.name.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        engine: formData.engine.trim(),
        power: formData.power,
        stockPower: formData.stockPower,
        fuelConsumption: formData.fuelConsumption ? formData.fuelConsumption.trim() : undefined,
        mods: formData.mods,
        photos: finalPhotos,
        isOwned: formData.isOwned,
        reminders: formData.reminders,
        status: formData.status || null,
        forSale: formData.forSale,
        salePrice: formData.salePrice ? parseInt(formData.salePrice) : undefined,
        saleDescription: formData.saleDescription ? formData.saleDescription.trim() : undefined
      };



      if (editingCar) {
        await Effect.runPromise(dataService.updateCar(editingCar.id, carData as any));
      } else {
        await Effect.runPromise(dataService.addCar(carData as any));
      }



      resetForm();
      fetchCars();
    } catch (err) {
      console.error("[Garage] Save failed", err);
      setError("Uložení selhalo. Zkuste to prosím znovu.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return (
    <LoginRequired
      title="Garáž je zamčená"
      message="Pro správu svých vozidel a úprav se musíte přihlásit do svého účtu."
      icon={CarFront}
    />
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm py-4 z-10 px-1 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-brand/10 p-3 rounded-2xl shrink-0">
              <CarFront className="text-brand" size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                Moje Garáž
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {cars.length} {cars.length === 1 ? 'vozidlo' : (cars.length >= 2 && cars.length <= 4 ? 'vozidla' : 'vozidel')}
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-brand text-slate-900 p-2 sm:p-3 px-4 sm:px-5 rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark hover:shadow-brand/40 transition-all font-bold text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} className="shrink-0" />
            <span>Přidat auto</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {carToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-500 text-white p-4 flex items-center gap-3">
              <AlertCircle size={24} />
              <h3 className="font-bold text-lg">Smazat vozidlo</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-6">
                Opravdu chcete smazat toto auto? Tato akce je <strong>nevratná</strong> a smažou se i všechny související záznamy.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Zrušit
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {editingCar ? <Pencil size={18} /> : <Plus size={18} />}
                {editingCar ? 'Upravit vozidlo' : 'Nové vozidlo'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Basic Info */}
              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Základní údaje</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Přezdívka auta</label>
                    <input placeholder="např. Daily, Projekt, Víkendovka..." className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Značka</label>
                    <input placeholder="Škoda" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                    <input placeholder="Octavia" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rok výroby</label>
                    <input type="number" placeholder="2005" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motorizace</label>
                    <input placeholder="1.9 TDI" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Aktuální Výkon (kW)</label>
                    <input type="number" placeholder="140" min="0" step="1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.power || ''} onChange={e => setFormData({ ...formData, power: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sériový Výkon (kW)</label>
                    <input type="number" placeholder="110" min="0" step="1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.stockPower || ''} onChange={e => setFormData({ ...formData, stockPower: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reálná Spotřeba</label>
                    <input placeholder="Např. 7.5 L/100km" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all" value={formData.fuelConsumption} onChange={e => setFormData({ ...formData, fuelConsumption: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fotografie</h4>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{formData.photos.length + selectedFiles.length} / 4</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Existing Photos */}
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200">
                      <CachedImage src={getImageUrl(photo, 'thumb')} className="w-full h-full object-cover" alt="Car" />
                      <button type="button" onClick={() => removeExistingPhoto(photo)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {/* New Files */}
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-brand/20 bg-brand/5">
                      <div className="w-full h-full flex items-center justify-center text-xs text-brand font-medium break-all p-2 text-center">
                        {file.name}
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {/* Add Button */}
                  {(formData.photos.length + selectedFiles.length < 4) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all gap-1"
                    >
                      <Camera size={24} />
                      <span className="text-xs font-medium">Přidat</span>
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                />
                <p className="text-xs text-slate-400 mt-2 text-center sm:text-left">Max 4 fotky, každá do 15 MB. Fotky jsou automaticky převedeny do WebP.</p>
              </div>

              {/* Mods */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Úpravy & Tuning</h4>
                  <button type="button" onClick={addMod} className="text-xs font-bold text-brand flex items-center gap-1 hover:underline">
                    <Plus size={14} />
                    Přidat úpravu
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.mods.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-slate-400 text-sm">Zatím žádné úpravy</p>
                    </div>
                  )}
                  {formData.mods.map((mod, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex-1 space-y-2">
                          <input
                            placeholder="Název úpravy (např. Sportovní sání)"
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-sm font-bold focus:ring-1 focus:ring-brand outline-none"
                            value={mod.name}
                            onChange={e => updateMod(i, 'name', e.target.value)}
                            required
                          />
                          <textarea
                            placeholder="Popis, parametry..."
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-sm focus:ring-1 focus:ring-brand outline-none resize-none h-16"
                            value={mod.description || ''}
                            onChange={e => updateMod(i, 'description', e.target.value)}
                          />
                        </div>
                        <button type="button" onClick={() => removeMod(i)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="bg-white border border-slate-200 p-1.5 rounded-lg text-xs"
                          value={mod.type}
                          onChange={e => updateMod(i, 'type', e.target.value)}
                        >
                          <option value="performance">Výkon</option>
                          <option value="styling">Vzhled</option>
                          <option value="audio">Audio</option>
                          <option value="maintenance">Údržba</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digitální Kaslík - Vehicle Reminders */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck size={16} className="text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digitální Kaslík</h4>
                </div>
                <VehicleRemindersEditor
                  reminders={formData.reminders}
                  onChange={(reminders) => setFormData({ ...formData, reminders })}
                />
              </div>

              {/* Vehicle Status */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={16} className="text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Vozidla</h4>
                </div>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none p-3 font-medium"
                  value={formData.status || ''}
                  onChange={e => setFormData({ ...formData, status: (e.target.value as VehicleStatus) || undefined })}
                >
                  <option value="">Bez statusu</option>
                  {Object.entries(VEHICLE_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-2">Určete aktuální stav vozidla</p>
              </div>

              {/* Ownership Status */}
              <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formData.isOwned}
                      onChange={e => setFormData({ ...formData, isOwned: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                  </div>
                  <span className="font-medium text-slate-700">
                    {formData.isOwned ? "Vozidlo stále vlastním (V garáži)" : "Vozidlo již nevlastním (Historie)"}
                  </span>
                </label>
              </div>

              {/* For Sale Section */}
              {formData.isOwned && (
                <div className="mb-8 p-4 bg-green-50 rounded-xl border border-green-200">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={formData.forSale}
                        onChange={e => setFormData({ ...formData, forSale: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">
                        {formData.forSale ? "Auto je na prodej" : "Nabídnout k prodeji"}
                      </span>
                    </div>
                  </label>

                  {formData.forSale && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">Cena (Kč)</label>
                        <input
                          type="number"
                          placeholder="např. 250000"
                          className="w-full bg-white border border-green-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                          value={formData.salePrice}
                          onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">Popis inzerátu</label>
                        <textarea
                          placeholder="Stav, výbava, důvod prodeje..."
                          className="w-full bg-white border border-green-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none h-20"
                          value={formData.saleDescription}
                          onChange={e => setFormData({ ...formData, saleDescription: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={uploading}
                  className={cn(
                    "w-full text-slate-900 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                    uploading ? "bg-slate-400 cursor-wait text-white" : "bg-brand hover:bg-brand-dark shadow-brand/20 hover:shadow-brand/40"
                  )}
                >
                  {uploading ? (
                    <>Ukládám data a nahrávám fotky...</>
                  ) : (
                    <>
                      <Save size={20} />
                      Uložit do garáže
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Načítám garáž..." className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cars.map(car => (
            <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">

              {/* Car Image Header */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {car.photos && car.photos.length > 0 ? (
                  <CachedImage src={getImageUrl(car.photos[0], 'thumb')} alt={car.name} priority={true} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <CarFront size={48} strokeWidth={1.5} />
                    <span className="text-xs font-medium mt-2">Bez fotky</span>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                {/* Badges Stack */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start">
                  {/* Ownership Badge */}
                  {(car.isOwned ?? true) ? (
                    <span className="bg-brand text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg border border-brand-light flex items-center gap-1">
                      V garáži
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 opacity-90">
                      Historie
                    </span>
                  )}

                  {/* For Sale Badge */}
                  {car.forSale && (
                    <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      <Tag size={12} />
                      Na prodej
                    </span>
                  )}

                  {/* Vehicle Status Badge */}
                  {car.status && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow border flex items-center gap-1 ${VEHICLE_STATUS_CONFIG[car.status].color.bg} ${VEHICLE_STATUS_CONFIG[car.status].color.text} ${VEHICLE_STATUS_CONFIG[car.status].color.border}`}>
                      {VEHICLE_STATUS_CONFIG[car.status].label}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="font-black text-xl tracking-tight leading-none mb-1">{car.name}</h3>
                  <p className="text-sm font-medium opacity-90">{car.make} {car.model} {car.year}</p>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => handleEdit(car)}
                    className="bg-white/90 text-slate-900 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, car.id)}
                    className="bg-red-500/90 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>



                {/* Reminder Status Dot */}
                {(() => {
                  const status = getReminderStatus(car.reminders);
                  if (!status) return null;
                  const colors = {
                    green: 'bg-green-500 shadow-green-500/50',
                    yellow: 'bg-yellow-500 shadow-yellow-500/50',
                    red: 'bg-red-500 shadow-red-500/50 animate-pulse'
                  };
                  return (
                    <div className="absolute bottom-3 right-3 z-20">
                      <span
                        className={`w - 3 h - 3 rounded - full ${colors[status]} shadow - lg block`}
                        title={status === 'green' ? 'Vše v pořádku' : status === 'yellow' ? 'Blíží se expirace' : 'Prošlá platnost!'}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Specs */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <Gauge className="text-brand" size={18} />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Motor</p>
                      <p className="text-sm font-bold leading-tight">{car.engine}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <Gauge className="text-brand" size={18} />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Výkon</p>
                      <p className="text-sm font-bold leading-tight">{car.power} kW</p>
                    </div>
                  </div>
                  {car.fuelConsumption && (
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <Gauge className="text-brand" size={18} />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Spotřeba</p>
                        <p className="text-sm font-bold leading-tight">{car.fuelConsumption} L/100km</p>
                      </div>
                    </div>
                  )}
                  {car.currentMileage && (
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <Gauge className="text-brand" size={18} />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Tachometr</p>
                        <p className="text-sm font-bold leading-tight">{car.currentMileage.toLocaleString()} km</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mods Preview */}
                {car.mods && car.mods.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                      <Wrench size={16} className="text-slate-400" />
                      <span>Úpravy ({car.mods.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {car.mods.slice(0, 3).map((mod, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          {mod.name}
                        </span>
                      ))}
                      {car.mods.length > 3 && (
                        <span className="text-xs text-slate-400 px-1 py-0.5">+{car.mods.length - 3} další</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 mt-3">
                  <Link
                    to={`/garage/${car.id}/service`}
                    className="bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Wrench size={16} />
                    Servis
                  </Link >
                  <Link
                    to={`/garage/${car.id}/fuel`}
                    className="bg-brand text-slate-900 font-bold py-2.5 rounded-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Fuel size={16} />
                    Tankování
                  </Link>
                </div >
              </div >
            </div >
          ))}

          {
            cars.length === 0 && !showForm && (
              <div className="col-span-full py-20 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                  <CarFront size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Zatím prázdná garáž</h3>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">Přidejte své první auto, sepisujte úpravy a sdílejte progres.</p>
                <button onClick={() => setShowForm(true)} className="text-brand font-bold hover:underline">
                  + Přidat první kousek
                </button>
              </div>
            )
          }
        </div >
      )}
    </div >
  );
}
