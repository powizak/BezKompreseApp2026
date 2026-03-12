# Projekt "Bez Komprese" – AI Guidelines & Architektonický Standard

Tyto pokyny (Guidelines) definují "Tone of Voice", vizuální standard a technologický přístup pro vývoj projektu Bez Komprese. Každý AI Agent nebo vývojář musí tyto pokyny striktně dodržovat.

## 1. Design Philosophy: "Intentional Minimalism" & Avant-Garde
*   **Anti-Generic:** Vyhnout se standardním, předpřipraveným "bootstrapped" layoutům. Usilovat o asymetrii, distinktivní typografii a unikátní vzhled, navazující na existující styl.
*   **The "Why" Factor:** Každý element musí mít účel. Pokud nemá účel (nebo je to jen vata), odstranit. Redukce je nejvyšší forma sofistikovanosti.
*   **Negativní prostor:** Whitespace (prázdný prostor) je funkční prvek. Využívat velkorysý padding a margin pro zvýšení čitelnosti a vzdušnosti.
*   **Práce s Barvami (Sloučení stávajícího a nového):**
    *   **Základní paleta:** Projekt aktuálně využívá světlý motiv (`bg-slate-50` pro pozadí, `text-slate-900` pro text). Tento čistý a prémiový "Light Motif" zůstává primárním standardem pro garáž a denní utility.
    *   **Akcenty:** Hlavní brandová barva je žlutá (Tailwind: `brand` - `#FFD600`). Používat ji funkčně, s vysokým kontrastem (např. vedle černé `brand-contrast` nebo absolutně prázdných ploch).
    *   **Immersive Modes (OLED Black):** Pro specifické "Avant-Garde" a emotivní funkce (jako *Acoustic Fingerprint* nebo *Zen Drive*) využívat naopak absolutně černé pozadí a neonové brandové prvky pro vyvolání pocitu exkluzivity, které vizuálně ostře oddělí utilitu od zážitku.

## 2. Frontend Coding Standards
*   **Architektura Komponent:** Projekt využívá nástroje jako `class-variance-authority`, `clsx` a `tailwind-merge`. Všechny nové znovupoužitelné prvky musí být definovány přes CVA s jasnými variantami.
*   **Library Discipline (Kritické):** V projektu jsou k dispozici headless primitiva z `@radix-ui/react-slot`. Pro komplexnější komponenty (např. modály nebo selecty) upřednostnit integraci existujícího Radix řešení nebo konzistentních custom knihoven namísto "bastlení" od nuly.
*   **Styling nad knihovnou:** Je žádoucí balit primitiva do čistého Tailwind CSS a využít `tailwind-merge` k propisování vlastních "Avant-Garde" classes, aniž by došlo ke kolizi.
*   **Čistota Codebase:** Neplýtvat vlastním CSS kódem (v `index.css`) tam, kde poslouží utility class z Tailwindu. Vlastní CSS omezit jen na globální resety (již existující scrollbary) a komplexní CSS animace.

## 3. Výkon, Animace a UX
*   **Performantní animace:** Animace vizuálních prvků musí využívat čistě CSS transformace (`transform: scale/translate`) nebo `opacity`. NIKDY nemanipulovat zbytečně DOMem kvůli animacím. Cílem je hladký chod a plynulý framerate na mobilních zařízeních.
*   **Mikro-interakce:** Místo přidávání dalších tlačítek využívat zřejmé hover/active states a mikro-interakce k posílení vizuální vazby s uživatelem. Zážitek má působit neviditelně, ale prémiově.

## 4. Operational Directives (Pro model chování AI)
*   Poskytovat odpovědi absolutně k věci, zero fluff (žádná filozofická omáčka v normálním režimu).
*   Vysoký důraz na code-first pristup u odpovedi, bez zbytečné polemiky, nespadá-li žádost pod speciální protokol ULTRATHINK.
