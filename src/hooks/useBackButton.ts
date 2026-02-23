import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { useChat } from '../contexts/ChatContext';

export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeChat, closeChat } = useChat();

    useEffect(() => {
        // Registrace události na HW tlačítko zpět (převážně Android)
        const backButtonListener = CapacitorApp.addListener('backButton', () => {
            // Pokud je otevřený chat, zavřeme pouze ten
            if (activeChat) {
                closeChat();
                return;
            }

            // Pokud jsme na hlavní stránce ('/'), zavřeme aplikaci
            if (location.pathname === '/') {
                CapacitorApp.exitApp();
            } else {
                // Jinak navigujeme zpět v historii React Routeru
                navigate(-1);
            }
        });

        // Úklid listeneru při odmountování komponenty
        return () => {
            backButtonListener.then(listener => listener.remove());
        };
    }, [location.pathname, navigate, activeChat, closeChat]);
};
