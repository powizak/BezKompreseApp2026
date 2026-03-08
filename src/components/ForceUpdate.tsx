import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ShieldAlert, Download } from 'lucide-react';

interface ForceUpdateProps {
    children: ReactNode;
}

// Helper to compare semantic versions
const isVersionOlder = (current: string, required: string) => {
    const parse = (v: string) => v.split('.').map(Number);
    const cur = parse(current);
    const req = parse(required);

    for (let i = 0; i < Math.max(cur.length, req.length); i++) {
        const c = cur[i] || 0;
        const r = req[i] || 0;
        if (c < r) return true;
        if (c > r) return false;
    }
    return false;
};

const ForceUpdate: React.FC<ForceUpdateProps> = ({ children }) => {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [updateLinks, setUpdateLinks] = useState({ playStore: '', appStore: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                if (!Capacitor.isNativePlatform()) {
                    // Skip check on web to avoid blocking browser testing, unless specifically testing native
                    setLoading(false);
                    return;
                }

                const info = await CapacitorApp.getInfo();
                const currentVersion = info.version;

                const versionDoc = await getDoc(doc(db, 'app-settings', 'version'));
                if (versionDoc.exists()) {
                    const data = versionDoc.data();
                    const minVersion = data.minVersion;

                    setUpdateLinks({
                        playStore: data.playStoreUrl || '',
                        appStore: data.appStoreUrl || ''
                    });

                    if (minVersion && isVersionOlder(currentVersion, minVersion)) {
                        setIsUpdateRequired(true);
                    }
                }
            } catch (error) {
                console.error('Error checking app version:', error);
            } finally {
                setLoading(false);
            }
        };

        checkVersion();
    }, []);

    const handleUpdate = () => {
        const platform = Capacitor.getPlatform();
        if (platform === 'android' && updateLinks.playStore) {
            window.open(updateLinks.playStore, '_system');
        } else if (platform === 'ios' && updateLinks.appStore) {
            window.open(updateLinks.appStore, '_system');
        } else {
            // Fallback if neither URL is available or platform isn't matched perfectly
            // (though native platform check above ensures this is iOS/Android mostly)
            const fallbackUrl = updateLinks.playStore || updateLinks.appStore;
            if (fallbackUrl) {
                window.open(fallbackUrl, '_system');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
                <div className="w-8 h-8 border-t-2 border-[#E5FF00] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isUpdateRequired) {
        return (
            <div className="min-h-screen bg-[#0E0E10] text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#E5FF00]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="z-10 flex flex-col items-center max-w-sm w-full space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl">
                        <ShieldAlert className="w-12 h-12 text-[#E5FF00]" strokeWidth={1.5} />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#E5FF00] rounded-full animate-ping" />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#E5FF00] rounded-full" />
                    </div>

                    <div className="text-center space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Kritická aktualizace</h1>
                        <p className="text-zinc-400 text-base leading-relaxed">
                            Vaše verze již není podporována. Pro pokračování a získání nových funkcí je potřeba aplikaci aktualizovat.
                        </p>
                    </div>

                    <button
                        onClick={handleUpdate}
                        className="w-full flex items-center justify-center gap-3 bg-[#E5FF00] text-black font-semibold tracking-wide py-4 px-6 rounded-2xl active:scale-95 transition-all duration-200"
                    >
                        <Download className="w-5 h-5" />
                        Aktualizovat nyní
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ForceUpdate;
