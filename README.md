# Bez Komprese Fan App

Fanouškovská aplikace pro YouTube kanál **Bez Komprese**, vyvinutá s důrazem na Mobile First přístup.

## 🌐 Živé Demo

Aplikace běží online na adrese: **[https://bezkompreseapp.web.app](https://bezkompreseapp.web.app)**

## ✨ Hlavní Funkce

### 🏠 Domovská Stránka
- **Sociální Feed**: Automatické načítání nejnovějších příspěvků z YouTube, Instagramu a Facebooku
- **Přehledné Karty**: Zobrazení videí, reelů a postů s náhledem a statistikami

### 🚗 Moje Garáž
- **Správa Vozidel**: Přidávání a editace vlastních aut s detailními informacemi
- **Fotogalerie**: Až 4 fotky na auto s automatickou kompresí
- **Tuning & Úpravy**: Sledování všech modifikací a vylepšení
- **Historie Vlastnictví**: Označení aut, která již nevlastníte
- **🆕 Statusy Aut**: Barevné odznaky pro auta (daily, sezónní, v renovaci, atd.)
- **🆕 Servisní Knížka**: Kompletní digitální evidence servisu
- **🆕 Digitální Kaslík**: Sledování platnosti STK, lékárničky, dálniční známky a pojištění (upozornění předem)
- **🆕 Tankování a Statistiky**: Grafy spotřeby, náklady palivo vs servis, cena za km, automatická synchronizace tachometru

### 🔧 Servisní Knížka (NOVÉ!)
- **Digitální Evidence**: Sledování všech servisních zásahů a oprav
- **Rychlé Šablony**: Předvyplněné formuláře pro běžné operace (olej, brzdy, pneumatiky)
- **Nákladová Analýza**: Grafy celkových nákladů a průměrných měsíčních výdajů
- **Upomínky**: Automatické připomínky nadcházejícího servisu podle km nebo data
- **Evidence Dílů**: Detailní seznam použitých dílů a materiálu
- **Timeline**: Chronologický přehled celé historie servisu

### 📅 Kalendář Akcí
- **Oficiální Akce**: Přehled nadcházejících srazů a eventů
- **Komunitní Srazy**: Možnost vytvořit vlastní sraz
- **Mapa**: Zobrazení akcí na interaktivní mapě
- **Detaily**: Informace o místě, čase a organizátorovi
- **🆕 Účast na akcích**: Tlačítko "Zúčastním se" s ukládáním do databáze
- **🆕 Diskuze pod akcí**: Komentáře a diskuze přímo u každé akce

### 👥 Komunita
- **Profily Uživatelů**: Zobrazení garáže a aktivit ostatních členů (včetně možnosti **odhlášení** v nastavení)
- **Seznam Uživatelů**: Procházení komunity s přehledem **TOP 5 nejoblíbenějších členů** (dle počtu přátel) a náhodný výběr dalších petrolheadů
- **🆕 Efektivní Vyhledávání**: Optimalizované vyhledávání uživatelů s minimálním počtem requestů
- **Veřejné Garáže**: Inspirace od ostatních autíčkářů
- **🚀 Výkonné Procházení**: Serverové stránkování a filtrování všech aut pro bleskové načítání i při tisících vozidlech

### 📍 Live Tracker (NOVÉ!)
- **Real-time Mapa**: Zobrazení polohy ostatních uživatelů v reálném čase (**hybridní podpora pro Safari/Chrome na iOS**)
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
- **Prodej aut**: Možnost označit auto v garáži jako "Na prodej" s cenou a popisem
- **Poptávky a Inzerce**: Vytváření inzerátů typu "Sháním auto/díly", "Nabízím díly/servis"
- **Filtrování a Hledání**: Fulltextové vyhledávání v inzerátech a autech na prodej
- **Přímý Kontakt**: Tlačítko pro okamžité zahájení chatu s prodejcem
- **Notifikace**: Upozornění na nové příspěvky v bazaru (volitelné)

### 🔔 Push Notifikace (NOVÉ!)
- **SOS Upozornění**: Okamžitá notifikace při volání o pomoc
- **Komentáře k akcím**: Notifikace o nových komentářích u akcí, kterých se účastníte
- **Změny v akcích**: Upozornění při změně data nebo místa akce
- **Přátelé**: Notifikace při přidání do přátel
- **🆕 Digitální Kaslík**: Upozornění na vypršení STK, lékárničky, pojištění nebo dálniční známky
- **🆕 Chat s uživateli**: Reálný chat mezi členy komunity s náhledy konverzací a historií
- **🆕 Bazar a Marketplace**: Prodej aut přímo z garáže a inzerce poptávek po dílech či servisu
- **Tiché hodiny**: Nastavitelný čas, kdy notifikace nepřijdou
- **Nativní nastavení**: Přímý odkaz do systémového nastavení notifikací (v Android aplikaci)

### 💡 Myšlenky pro budoucí verze
- V [ideas.md](docs/ideas.md) najdete některé myšlenky pro budoucí verze aplikace, které můžete sami navrhovat.

### 🐛 Známé Chyby
- V [knowBugs.md](knowBugs.md) najdete seznam známých chyb a technických problémů, na kterých pracujeme.


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
*   **Optimalizace:** Image caching (Cache-Control immutable, ImageLoader concurrency limit & circuit breaker, Prioritized loading for cars > avatars, Profile photo internalization), Input sanitation (auto-trim), Fast Initial Auth emission (Stale-while-revalidate), Stable useEffect dependencies (Double-loading prevention), Unified Loading UX (Rotating Logo), Social Feed caching (10min limit)

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

Tento projekt je vytvořen pro primárně pro fanoušky kanálu Bez Komprese, avšak budeme rádi za použití kýmkoliv dalším.
