import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Registrace události na HW tlačítko zpět (převážně Android)
        const backButtonListener = CapacitorApp.addListener('backButton', () => {
            // Pokud jsme na hlavní stránce ('/'), zavřeme aplikaci
            if (location.pathname === '/') {
                CapacitorApp.exitApp();
            } else {
                // Jinak navigujeme zpět v historii React Routeru
                // canGoBack říká, zda má webview interní historii, ale my spoléháme primárně na React Router
                navigate(-1);
            }
        });

        // Úklid listeneru při odmountování komponenty
        return () => {
            backButtonListener.then(listener => listener.remove());
        };
    }, [location.pathname, navigate]);
};
