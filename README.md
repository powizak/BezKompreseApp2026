# Bez Komprese Fan App

Fanouškovská aplikace pro YouTube kanál **Bez Komprese**, vyvinutá s důrazem na Mobile First přístup.

## 🌐 Živé Demo

Aplikace běží online na adrese: **[https://bezkompreseapp.web.app](https://bezkompreseapp.web.app)**

## ✨ Hlavní Funkce

### 🏠 Domovská Stránka
- **Sociální Feed**: Automatické načítání nejnovějších příspěvků z YouTube, Instagramu a Facebooku
- **Přehledné Karty**: Zobrazení videí, reelů a postů s náhledem a statistikami
- **🆕 Sdílení**: Možnost zkopírovat odkaz nebo použít nativní sdílení u každého příspěvku

### 🚗 Moje Garáž
- **Správa Vozidel**: Přidávání a editace vlastních aut s detailními informacemi
- **Fotogalerie**: Až 4 fotky na auto s automatickou kompresí (max 15 MB)
- **Tuning & Úpravy**: Sledování všech modifikací a vylepšení
- **Historie Vlastnictví**: Označení aut, která již nevlastníte
- **🆕 Statusy Aut**: Barevné odznaky pro auta (daily, sezónní, v renovaci, atd.)
- **🆕 Servisní Knížka**: Kompletní digitální evidence servisu
- **🆕 Digitální Kaslík**: Sledování platnosti STK, lékárničky, dálniční známky a pojištění (upozornění předem)
- **🆕 Tankování a Statistiky**: Inteligentní křížový výpočet hodnot (litry/cena), grafy spotřeby, náklady palivo vs servis, cena za km, automatická synchronizace tachometru (volitelné u částečného tankování)

### 🔧 Servisní Knížka (NOVÉ!)
- **Digitální Evidence**: Sledování všech servisních zásahů a oprav
- **Rychlé Šablony**: Předvyplněné formuláře pro běžné operace (olej, brzdy, pneumatiky)
- **Nákladová Analýza**: Grafy celkových nákladů a průměrných měsíčních výdajů
- **Upomínky**: Automatické připomínky nadcházejícího servisu podle km nebo data (včetně inteligentní detekce **servisu po termínu** s týdenním opakováním)
- **Evidence Dílů**: Detailní seznam použitých dílů a materiálu
- **Timeline**: Chronologický přehled celé historie servisu

### 📅 Kalendář Akcí
- **Oficiální Akce**: Přehled nadcházejících srazů a eventů
- **Komunitní Srazy**: Možnost vytvořit vlastní sraz
- **Mapa**: Zobrazení akcí na interaktivní mapě
- **🆕 Detaily**: Informace o místě, čase a organizátorovi včetně navigace a mapy
- **🆕 Správa akcí**: Organizátoři mohou své akce upravovat nebo mazat (omezeno na budoucí akce)
- **🆕 Účast na akcích**: Tlačítko "Zúčastním se" s ukládáním do databáze
- **🆕 Diskuze pod akcí**: Komentáře a diskuze přímo u každé akce

### 👥 Komunita
- **Profily Uživatelů**: Zobrazení garáže a aktivit ostatních členů (včetně možnosti **odhlášení** v nastavení)
- **Seznam Uživatelů**: Procházení komunity s přehledem **TOP 5 nejoblíbenějších členů** (dle počtu přátel) a náhodný výběr dalších petrolheadů
- **🆕 Efektivní Vyhledávání**: Optimalizované vyhledávání uživatelů (přes `prefix searchKeys`) s vyhledáváním dle současného i původního jména a bleskovým načítáním.
- **Veřejné Garáže**: Inspirace od ostatních autíčkářů
- **🆕 Systém Odznaků**: Komplexní systém sbírání unikátních odznaků za aktivitu (BK Team Badge, High Miler, Wrench Wizard a.j.) s transakčním připisováním a retroaktivní kontrolou.
- **🆕 Pokročilé Statistiky**: Rychlý přehled celkového počtu zaregistrovaných uživatelů a spravovaných vozidel napříč aplikací (v sekci Info).
- **🚀 Výkonné Procházení**: Serverové stránkování a filtrování všech aut pro bleskové načítání i při tisících vozidlech

### 📍 Live Tracker (NOVÉ!)
- **Real-time Mapa**: Zobrazení polohy ostatních uživatelů v reálném čase (**hybridní podpora pro Safari/Chrome na iOS**)
- **Běh na pozadí**: Foreground Sledování polohy s permanentní notifikací i při zamknutém telefonu (při uděleném povolení Vždy).
- **Proximity Alerts**: Lokální klientské notifikace na okolní uživatele podle nastavitelného rádiusu (1-100 km) k zabránění spamování.
- **Privacy Zóny**: Automatické skrytí polohy v blízkosti domova
- **Statusy**: Nastavení statusu (Dáme pokec?, Závod?, Projížďka?, atd.)
- **🆘 Help Beacon**: S.O.S. systém pro nouzové situace
  - Plovoucí S.O.S. tlačítko na mapě
  - 5 typů problémů (porucha, prázdná nádrž, nehoda, defekt, jiné)
  - Pulsující červený marker viditelný do 50 km
  - Tlačítko "Jedu pomoct!" pro ostatní uživatele
  - Možnost přidat popis situace
  - Sledování stavu (aktivní, pomoc na cestě, vyřešeno)

### 🏪 Bazar a Marketplace (NOVÉ!)
- **🆕 Tří-tabový layout**: Přenastavení bazaru na sekce "Prodej aut", "Poptávky" a "Nabídky" pro lepší přehlednost
- **🆕 Unified Grid**: Sjednocené zobrazení aut z garáže i samostatných inzerátů v jednom feedu
- **🆕 Samostatné Inzeráty**: Možnost prodat auto i bez nutnosti mít ho v aplikaci v garáži
- **🆕 Detail Inzerátu**: Nová detailní stránka pro každý inzerát s velkou galerií a **nativním sdílením přes systémové rozhraní**
- **🆕 Navigace**: Chytré přesměrování (samostatný inzerát vs detail auta v garáži)
- **🆕 Workflow Prodeje**: Možnost označit stávající auto z garáže jako "Prodané" – aplikace jej archivuje pod kapotu a současně stáhne aktivní inzerát i prodávaný status.
- **Vizuální Opravy**: Sjednocené a vrstvené štítky u inzerátů (předcházení překryvu)

### 🔔 Push Notifikace (NOVÉ!)
- **SOS Upozornění**: Okamžitá notifikace při volání o pomoc
- **Komentáře k akcím**: Notifikace o nových komentářích u akcí, kterých se účastníte
- 👤 **Profil a Přátelé**: Správa vlastního garážového stání, sledování přátel a sbírání odznaků.
- ✨ **Onboarding Wizard**: Moderní úvodní průvodce pro nové uživatele s integrací oprávnění.
- 🔔 **Chytré Notifikace**: Push oznámení pro chat, SOS, nové akce a připomínky (STK, servis).lík**: Upozornění na vypršení STK, lékárničky, pojištění nebo dálniční známky
- **🆕 Chat s uživateli**: Reálný chat mezi členy komunity s náhledy konverzací, historií a **možností prokliknout se přímo na profil uživatele**
- **🆕 Bazar a Marketplace**: Prodej aut přímo z garáže a inzerce poptávek po dílech či servisu
- **Tiché hodiny**: Nastavitelný čas, kdy notifikace nepřijdou (globální vynucení pro všechny typy kromě SOS)
- **Nativní nastavení**: Přímý odkaz do systémového nastavení notifikací (v Android aplikaci)
- **🆕 Proaktivní žádosti**: Inteligentní systém primer dialogů před OS promptem pro vyšší konverzi souhlasů
- **🆕 Web Push podpora**: Kompletní zprovoznění notifikací pro prohlížeče (VAPID + Service Worker)
- **🚀 Optimalizace**: Serverové filtrování příjemců (onNewEvent) pro úsporu Firestore čtení při velkém počtu uživatelů
- **🆕 iOS Launch Readiness**: Kompletní příprava pro iOS (Bundle ID, Firebase Auth, Push notifikace přes APNs, Geolocation permissions)

### 🎨 Design a Uživatelský Zážitek (UX)
- **Sjednocené UI**: Sjednocený, elegantní vizuální styl hlaviček na všech hlavních stránkách (Garáž, Bazar, Servisní knížka, Lidé, Akce, apod.).
- **Náhledy Profilovek**: Okamžitý vizuální náhled vybrané profilové fotky ještě před jejím finálním odesláním a ořezem.
- **Gesta na mobilech**: Plná podpora přirozených navigačních gest (natívní swipe-back na platformě iOS, inteligentní handling tlačítka zpět na OS Android).

### 📋 Changelog
- V [changelog.md](docs/changelog.md) najdete historii změn v aplikaci, včetně nedávných updatů NPM balíčků a bezpečnostních oprav.

### 💡 Myšlenky pro budoucí verze
- V [ideas.md](docs/ideas.md) najdete některé myšlenky pro budoucí verze aplikace, které můžete sami navrhovat.

### 🐛 Známé Chyby
- V [knownbugs.md](docs/knownbugs.md) najdete seznam známých chyb a technických problémů, na kterých pracujeme.
- V [docs/firestore-indexes-guide.md](docs/firestore-indexes-guide.md) najdete postup pro nastavení databázových indexů.


### ⚖️ Právní informace a Soukromí (AKTUALIZOVÁNO!)
- **GDPR Kompatibilita**: Kompletní revize zásad zpracování osobních údajů.
- **Transparentnost**: Jasně definovaná pravidla pro Bazar, Tracker a sdílení dat o spotřebě.
- **Kontakt**: Přímý kontakt na správce údajů (Jakub Prošek) pro uplatnění práv uživatelů.

## Technologie

*   **Runtime:** Node.js (nebo Bun)
*   **Frontend:** React + Vite
*   **Jazyk:** TypeScript
*   **Logika & Efekty:** [Effect](https://effect.website)
*   **Stylování:** Tailwind CSS
*   **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
*   **Mapy:** Leaflet + OpenStreetMap
*   **Optimalizace**: Mobilní navigace (Hardware tlačítko zpět pro Android, nativní swipe-back gesto pro iOS), Image caching (Cache-Control immutable, ImageLoader concurrency limit & circuit breaker, Prioritized loading for cars > avatars, Simplified profile photo pipeline (130x130px WebP) with robust Google fallback & internalization storage optimization), Unified 15MB Image Upload Pipeline (WebP conversion, quality 0.7), Unified visual style for all main page headers, Input sanitation (auto-trim), Fast Initial Auth emission (Stale-while-revalidate), Stable useEffect dependencies (Double-loading prevention), Unified Loading UX (Rotating Logo), Social Feed caching (10min limit), YouTube API optimization (using playlistItems for 100x quota saving), Advanced Code Splitting (Vite manualChunks), Reusable Event Form with runtime validation/cleaning (preventing Firestore invalid-argument errors), Multi-field Array Prefix Search (searchKeys utility for community search), **Native Sharing API integration (@capacitor/share)**


## Jak spustit projekt

1.  Nainstalujte závislosti:
    ```bash
    npm install
    # nebo
    bun install
    ```

2.  Spusťte vývojový server:
    ```bash
    npm run dev
    # nebo
    bun dev
    ```

3.  Otevřete v prohlížeči adresu, kterou vypíše konzole (obvykle `http://localhost:5173`).

## Nastavení Firebase

Aby aplikace plně fungovala (přihlašování, ukládání aut, servisní knížka), je potřeba vytvořit projekt na Firebase.

1.  Jděte na [Firebase Console](https://console.firebase.google.com/).
2.  Vytvořte nový projekt "Bez Komprese App".
3.  V sekci **Authentication** zapněte metodu **Google**.
4.  V sekci **Firestore Database** vytvořte databázi (v test módu).
5.  V sekci **Storage** aktivujte Firebase Storage pro ukládání fotek.
6.  Jděte do **Project Settings** -> General -> Your apps -> Web app -> SDK Setup and Configuration.
7.  Zkopírujte konfigurační objekt (`apiKey`, `authDomain`, atd.).
8.  Vytvořte soubor `.env` podle `.env.example` a vyplňte Firebase credentials.

### Firestore Kolekce

Aplikace používá následující kolekce:
- `users` - Uživatelské profily
- `cars` - Vozidla uživatelů
- `events` - Komunitní akce a srazy
- `event-comments` - Komentáře k akcím
- `service-records` - Záznamy ze servisní knížky
- `presence` - Real-time poloha uživatelů pro Live Tracker
- `help-beacons` - S.O.S. signály pro nouzové situace
- `marketplace-listings` - Inzeráty v bazaru (poptávky, díly)
- `chats` - Konverzace mezi uživateli

## Struktura projektu

*   `src/services/` - Logika aplikace obalená v Effect (AuthService, DataService).
*   `src/pages/` - Jednotlivé obrazovky (Home, Garage, ServiceBook, Events, Info).
*   `src/components/` - Sdílené komponenty (Layout, EventMap, Footer).
*   `src/contexts/` - React Context pro zpřístupnění služeb.
*   `src/types/` - TypeScript definice (Car, ServiceRecord, AppEvent).
*   `src/lib/` - Utility funkce (imageOptimizer).

## Deployment

Aplikace je automaticky deployována na Firebase Hosting při push do main větve.

Pro manuální deployment:
```bash
npm run build
firebase deploy
```

## Licence a Přispívání
© 2026 Jakub Prošek. Všechna práva vyhrazena.

Zdrojový kód je zveřejněn za účelem transparentnosti a umožnění komunitního vývoje (Pull Requests) pro **tuto konkrétní aplikaci**.

- **✅ Povoleno:** Prohlížení kódu, učení se z něj, navrhování změn a oprav (Fork + Pull Request) do tohoto repozitáře.
- **❌ Zakázáno:** Redistribuce, prodej, nebo provozování upravených kopií aplikace pod vlastním jménem bez výslovného souhlasu autora.

Tento projekt je vytvořen pro primárně pro fanoušky kanálu Bez Komprese, avšak budeme rádi za použití aplikace kýmkoliv dalším.
