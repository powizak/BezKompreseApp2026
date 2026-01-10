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
- **🆕 Servisní Knížka**: Kompletní digitální evidence servisu

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

### 👥 Komunita
- **Profily Uživatelů**: Zobrazení garáže a aktivit ostatních členů
- **Seznam Uživatelů**: Procházení celé komunity
- **Veřejné Garáže**: Inspirace od ostatních autíčkářů

## Technologie

*   **Runtime:** Node.js (nebo Bun)
*   **Frontend:** React + Vite
*   **Jazyk:** TypeScript
*   **Logika & Efekty:** [Effect](https://effect.website)
*   **Stylování:** Tailwind CSS
*   **Backend:** Firebase (Auth, Firestore, Storage)
*   **Mapy:** Leaflet + OpenStreetMap

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
- `service-records` - Záznamy ze servisní knížky

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

## Licence

Tento projekt je vytvořen pro fanoušky kanálu Bez Komprese.
