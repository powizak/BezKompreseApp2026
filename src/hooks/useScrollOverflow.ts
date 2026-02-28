import { useState, useRef, useEffect, useCallback } from 'react';

export function useScrollOverflow() {
    const ref = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        if (ref.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            // Tolerance 2px pro zaokrouhlovací chyby prohlížečů
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
        }
    }, []);

    useEffect(() => {
        checkScroll();

        // Timeout pro zachycení případných asynchronních změn stylů po prvním renderu
        const timeoutId = setTimeout(checkScroll, 100);

        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    // Reaguj na změnu obsahu a velikosti uvnitř kontejneru
    useEffect(() => {
        if (!ref.current) return;

        const observer = new MutationObserver(() => {
            checkScroll();
        });

        observer.observe(ref.current, { childList: true, subtree: true, characterData: true });

        // Element resize observer - klíčové pro správnou detekci, když se z layoutu
        // objeví/zmizí scrollovací lišta, nebo když web prohlížeč přepočítá flexbox/width elementy
        const resizeObserver = new ResizeObserver(() => {
            checkScroll();
        });

        resizeObserver.observe(ref.current);

        return () => {
            observer.disconnect();
            resizeObserver.disconnect();
        };
    }, [checkScroll]);

    return { ref, canScrollLeft, canScrollRight, checkScroll };
}
