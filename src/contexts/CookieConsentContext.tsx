import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ConsentStatus = 'granted' | 'denied' | 'pending';

interface CookieConsentContextType {
    consent: ConsentStatus;
    acceptCookies: () => void;
    declineCookies: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
    const [consent, setConsent] = useState<ConsentStatus>('pending');

    useEffect(() => {
        const storedConsent = localStorage.getItem('cookie_consent');
        if (storedConsent === 'granted' || storedConsent === 'denied') {
            setConsent(storedConsent);
        }
    }, []);

    const acceptCookies = () => {
        setConsent('granted');
        localStorage.setItem('cookie_consent', 'granted');
    };

    const declineCookies = () => {
        setConsent('denied');
        localStorage.setItem('cookie_consent', 'denied');
    };

    return (
        <CookieConsentContext.Provider value={{ consent, acceptCookies, declineCookies }}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = () => {
    const context = useContext(CookieConsentContext);
    if (context === undefined) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
};
