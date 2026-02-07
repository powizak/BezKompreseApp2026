import { useState } from 'react';
import { ClipboardCheck, Cross, BadgeCheck, Shield, Calendar, Bell, BellOff } from 'lucide-react';
import type { VehicleReminder, ReminderType } from '../types';
import { REMINDER_CONFIG } from '../types';

interface VehicleRemindersEditorProps {
    reminders: VehicleReminder[];
    onChange: (reminders: VehicleReminder[]) => void;
}

const REMINDER_ICONS: Record<ReminderType, React.ElementType> = {
    stk: ClipboardCheck,
    first_aid_kit: Cross,
    highway_vignette: BadgeCheck,
    liability_insurance: Shield
};

export default function VehicleRemindersEditor({ reminders, onChange }: VehicleRemindersEditorProps) {
    // Initialize with all reminder types, preserving existing values
    const getAllReminders = (): VehicleReminder[] => {
        const types: ReminderType[] = ['stk', 'first_aid_kit', 'highway_vignette', 'liability_insurance'];
        return types.map(type => {
            const existing = reminders.find(r => r.type === type);
            return existing || { type, expirationDate: '', notifyEnabled: true };
        });
    };

    const [localReminders, setLocalReminders] = useState<VehicleReminder[]>(getAllReminders());

    const updateReminder = (type: ReminderType, field: 'expirationDate' | 'notifyEnabled', value: string | boolean) => {
        const updated = localReminders.map(r =>
            r.type === type ? { ...r, [field]: value } : r
        );
        setLocalReminders(updated);
        // Only include reminders that have a date set
        onChange(updated.filter(r => r.expirationDate));
    };

    const getReminderStatus = (reminder: VehicleReminder): 'green' | 'yellow' | 'red' | null => {
        if (!reminder.expirationDate) return null;

        const now = new Date();
        const exp = new Date(reminder.expirationDate);
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return 'red';
        if (daysLeft <= 30) return 'yellow';
        return 'green';
    };

    const getStatusDot = (status: 'green' | 'yellow' | 'red' | null) => {
        if (!status) return null;
        const colors = {
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            red: 'bg-red-500'
        };
        return <span className={`w-2 h-2 rounded-full ${colors[status]} inline-block ml-2`} />;
    };

    return (
        <div className="space-y-3">
            {localReminders.map(reminder => {
                const config = REMINDER_CONFIG[reminder.type];
                const Icon = REMINDER_ICONS[reminder.type];
                const status = getReminderStatus(reminder);

                return (
                    <div
                        key={reminder.type}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                                <Icon size={18} className="text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <span className="font-bold text-slate-900 text-sm">
                                    {config.label}
                                    {getStatusDot(status)}
                                </span>
                                <p className="text-xs text-slate-400">
                                    Upozornění: {config.warningDays.join(' a ')} dní předem
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={reminder.expirationDate}
                                        onChange={e => updateReminder(reminder.type, 'expirationDate', e.target.value)}
                                        className="w-full bg-white border border-slate-200 p-2.5 pl-10 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                        placeholder="Platnost do"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => updateReminder(reminder.type, 'notifyEnabled', !reminder.notifyEnabled)}
                                className={`p-2.5 rounded-lg border transition-all ${reminder.notifyEnabled
                                        ? 'bg-brand/10 border-brand text-brand'
                                        : 'bg-slate-100 border-slate-200 text-slate-400'
                                    }`}
                                title={reminder.notifyEnabled ? 'Notifikace zapnuty' : 'Notifikace vypnuty'}
                            >
                                {reminder.notifyEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
