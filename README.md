# Bez Komprese Fan App

Fanouškovská aplikace pro YouTube kanál **Bez Komprese**, vyvinutá s důrazem na Mobile First přístup.

## Technologie

*   **Runtime:** Node.js (nebo Bun)
*   **Frontend:** React + Vite
*   **Jazyk:** TypeScript
*   **Logika & Efekty:** [Effect](https://effect.website)
*   **Stylování:** Tailwind CSS
*   **Backend:** Firebase (Auth, Firestore)

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

Aby aplikace plně fungovala (přihlašování, ukládání aut), je potřeba vytvořit projekt na Firebase.

1.  Jděte na [Firebase Console](https://console.firebase.google.com/).
2.  Vytvořte nový projekt "Bez Komprese App".
3.  V sekci **Authentication** zapněte metodu **Google**.
4.  V sekci **Firestore Database** vytvořte databázi (v test módu).
5.  Jděte do **Project Settings** -> General -> Your apps -> Web app -> SDK Setup and Configuration.
6.  Zkopírujte konfigurační objekt (`apiKey`, `authDomain`, atd.).
7.  Vložte ho do souboru `src/config/firebase.ts` místo placeholder hodnot.

## Struktura projektu

*   `src/services/` - Logika aplikace obalená v Effect (AuthService, DataService).
*   `src/pages/` - Jednotlivé obrazovky (Home, Garage, Events, Info).
*   `src/components/` - Sdílené komponenty (Layout).
*   `src/contexts/` - React Context pro zpřístupnění služeb.
