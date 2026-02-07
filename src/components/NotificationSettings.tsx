import { useState, useEffect } from 'react';
import { Effect } from 'effect';
import { Bell, BellOff, AlertTriangle, Calendar, Users, MessageCircle, RefreshCw, Info, Moon, Layers, ExternalLink, Check } from 'lucide-react';
import { NotificationService, NotificationServiceLive, type NotificationPermissionStatus } from '../services/NotificationService';
import type { NotificationSettings, EventType } from '../types';
import { EVENT_TYPE_LABELS } from '../types';

interface NotificationSettingsProps {
    settings: NotificationSettings;
    onChange: (settings: NotificationSettings) => void;
    userId: string;
}

export default function NotificationSettingsSection({ settings, onChange, userId }: NotificationSettingsProps) {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('prompt');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const notificationService = Effect.runSync(
        Effect.gen(function* (_) {
            return yield* _(NotificationService);
        }).pipe(Effect.provide(NotificationServiceLive))
    );

    useEffect(() => {
        // Check initial permission status
        Effect.runPromise(notificationService.checkPermission)
            .then(setPermissionStatus)
            .catch(console.error);
    }, []);

    const handleRequestPermission = async () => {
        setIsRegistering(true);
        try {
            const status = await Effect.runPromise(notificationService.requestPermission);
            setPermissionStatus(status);

            if (status === 'granted') {
                // Register device for push notifications
                await Effect.runPromise(notificationService.registerDevice(userId));
                setRegistrationSuccess(true);
                onChange({ ...settings, enabled: true });
                setTimeout(() => setRegistrationSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleMasterToggle = async () => {
        if (!settings.enabled && permissionStatus !== 'granted') {
            await handleRequestPermission();
        } else {
            onChange({ ...settings, enabled: !settings.enabled });
        }
    };

    const handleEventTypeToggle = (type: EventType) => {
        const currentTypes = settings.newEvents.types;
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        onChange({
            ...settings,
            newEvents: { ...settings.newEvents, types: newTypes }
        });
    };

    const Toggle = ({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-brand' : 'bg-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
    );

    const SettingRow = ({ icon: Icon, title, description, enabled, onToggle, disabled = false }: {
        icon: any; title: string; description: string; enabled: boolean; onToggle: () => void; disabled?: boolean;
    }) => (
        <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                    <Icon size={18} className="text-slate-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <Toggle enabled={enabled} onToggle={onToggle} disabled={disabled} />
        </div>
    );

    return (
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand/10 text-brand rounded-xl">
                    <Bell size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Nastavení Notifikací</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Push oznámení</p>
                </div>
            </div>

            {/* Permission Status Banner */}
            {permissionStatus === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <BellOff size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-700 text-sm">Notifikace jsou zablokované</p>
                        <p className="text-xs text-red-600 mt-1">
                            Povolte notifikace v nastavení {notificationService.isNativePlatform ? 'zařízení' : 'prohlížeče'}.
                        </p>
                        {notificationService.isNativePlatform && (
                            <button
                                onClick={() => Effect.runPromise(notificationService.openSystemSettings)}
                                className="mt-2 text-xs font-bold text-red-700 flex items-center gap-1 hover:underline"
                            >
                                <ExternalLink size={12} /> Otevřít nastavení systému
                            </button>
                        )}
                    </div>
                </div>
            )}

            {registrationSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <p className="font-bold text-green-700 text-sm">Notifikace úspěšně povoleny!</p>
                </div>
            )}

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white">
                <div className="flex items-center gap-3">
                    <Bell size={24} />
                    <div>
                        <h3 className="font-bold">Povolit notifikace</h3>
                        <p className="text-xs text-slate-300">Hlavní přepínač pro všechna oznámení</p>
                    </div>
                </div>
                <button
                    onClick={handleMasterToggle}
                    disabled={isRegistering || permissionStatus === 'denied'}
                    className={`w-14 h-7 rounded-full transition-colors relative ${settings.enabled && permissionStatus === 'granted' ? 'bg-brand' : 'bg-slate-600'} ${isRegistering ? 'animate-pulse' : ''}`}
                >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.enabled && permissionStatus === 'granted' ? 'left-8' : 'left-1'}`} />
                </button>
            </div>

            {/* Notification Categories */}
            <div className={`space-y-3 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Typy notifikací</h4>

                <SettingRow
                    icon={AlertTriangle}
                    title="SOS volání"
                    description="Oznámení o volání SOS od ostatních"
                    enabled={settings.sosAlerts}
                    onToggle={() => onChange({ ...settings, sosAlerts: !settings.sosAlerts })}
                    disabled={!settings.enabled}
                />

                <SettingRow
                    icon={Users}
                    title="Žádosti o přátelství"
                    description="Když vás někdo přidá do přátel"
                    enabled={settings.friendRequests}
                    onToggle={() => onChange({ ...settings, friendRequests: !settings.friendRequests })}
                    disabled={!settings.enabled}
                />

                <SettingRow
                    icon={MessageCircle}
                    title="Komentáře k akcím"
                    description="Nové komentáře u akcí, kterých se účastníte"
                    enabled={settings.eventComments}
                    onToggle={() => onChange({ ...settings, eventComments: !settings.eventComments })}
                    disabled={!settings.enabled}
                />

                <SettingRow
                    icon={RefreshCw}
                    title="Změny v akcích"
                    description="Aktualizace akcí, kterých se účastníte"
                    enabled={settings.eventChanges}
                    onToggle={() => onChange({ ...settings, eventChanges: !settings.eventChanges })}
                    disabled={!settings.enabled}
                />

                <SettingRow
                    icon={Info}
                    title="Obecné informace"
                    description="Nové verze aplikace a důležité novinky"
                    enabled={settings.appUpdates}
                    onToggle={() => onChange({ ...settings, appUpdates: !settings.appUpdates })}
                    disabled={!settings.enabled}
                />

                {/* New Events with Type Selection */}
                <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 ${!settings.enabled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-100">
                                <Calendar size={18} className="text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Nové akce</h3>
                                <p className="text-xs text-slate-500">Oznámení o nových akcích</p>
                            </div>
                        </div>
                        <Toggle
                            enabled={settings.newEvents.enabled}
                            onToggle={() => onChange({ ...settings, newEvents: { ...settings.newEvents, enabled: !settings.newEvents.enabled } })}
                            disabled={!settings.enabled}
                        />
                    </div>

                    {settings.newEvents.enabled && settings.enabled && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleEventTypeToggle(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.newEvents.types.includes(type)
                                        ? 'bg-brand text-brand-contrast'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-brand'
                                        }`}
                                >
                                    {EVENT_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Advanced Settings */}
            <div className={`space-y-3 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Pokročilé nastavení</h4>

                {/* Quiet Hours */}
                <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 ${!settings.enabled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-100">
                                <Moon size={18} className="text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Tiché hodiny</h3>
                                <p className="text-xs text-slate-500">Pozastavit notifikace v daném čase</p>
                            </div>
                        </div>
                        <Toggle
                            enabled={settings.quietHours.enabled}
                            onToggle={() => onChange({ ...settings, quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled } })}
                            disabled={!settings.enabled}
                        />
                    </div>

                    {settings.quietHours.enabled && settings.enabled && (
                        <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500">Od:</label>
                                <select
                                    value={settings.quietHours.startHour}
                                    onChange={(e) => onChange({ ...settings, quietHours: { ...settings.quietHours, startHour: parseInt(e.target.value) } })}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500">Do:</label>
                                <select
                                    value={settings.quietHours.endHour}
                                    onChange={(e) => onChange({ ...settings, quietHours: { ...settings.quietHours, endHour: parseInt(e.target.value) } })}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Digest Mode */}
                <SettingRow
                    icon={Layers}
                    title="Seskupovat notifikace"
                    description="Seskupit více notifikací do jedné zprávy"
                    enabled={settings.digestMode}
                    onToggle={() => onChange({ ...settings, digestMode: !settings.digestMode })}
                    disabled={!settings.enabled}
                />
            </div>

            {/* System Settings Link (Native only) */}
            {notificationService.isNativePlatform && (
                <button
                    onClick={() => Effect.runPromise(notificationService.openSystemSettings)}
                    className="w-full mt-4 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-bold text-slate-600 flex items-center justify-center gap-2 transition-colors"
                >
                    <ExternalLink size={16} />
                    Otevřít nastavení systému
                </button>
            )}
        </section>
    );
}
