# Changelog

Všechny důležité změny v projektu jsou zaznamenány v tomto souboru.

## [0.0.39] - 2026-02-18
### Přidáno
- Oprava výpočtu spotřeby paliva (akumulace litrů při částečných tankováních).
- Přesnější výpočet průměrné spotřeby auta (metoda první/poslední plná nádrž).
- Vizuální indikátory (ikony) plné/částečné nádrže v historii tankování.
- Tlačítko pro uložení nastavení notifikací v profilu uživatele.
- Sjednocení UX s ostatními sekcemi nastavení v profilu.

## [0.0.38] - 2026-02-18
### Opraveno
- Oprava načítání kompletních dat v uživatelském profilu (přátelé, odznaky, nastavení) po refreshi stránky.
- Vynuceno čtení přímo ze serveru (`getDocFromServer`) pro prevenci "znečištění" lokální Firestore cache.
- Opravena logika synchronizace Auth stavu v `AuthService`.

## [0.0.37] - 2026-02-17
### Přidáno
- Povolení scrollování v postranním menu pro mobilní zařízení v režimu na šířku (landscape).
- Vlastní tenký scrollbar pro postranní menu.

## [0.0.36] - 2026-02-17
### Přidáno
- Kaskádové filtrování aut (Značka → Model → Motorizace) v sekci `/cars`.
- Využití relační mapy na klientovi pro minimalizaci Firestore requestů při filtrování.

## [0.0.35] - 2026-02-17
### Technické
- Upgrade balíčku `androidxCredentials` na stabilní verzi `1.5.0`.
- Automatický fallback na legacy `GoogleSignInClient` pro zařízení se špatnou podporou Credential Manageru.

## [0.0.34] - 2026-02-16
### iOS & Mac
- Sjednocení Bundle ID a integrace Firebase & APNs v nativním AppDelegate.
- Oprávnění pro polohu a push notifikace v `Info.plist`.
- Oprava pádů StatusBaru na iOS.
- Oprava visícího Google přihlášení na iOS (`initializeAuth` fix).

## [0.0.33] - 2026-02-16
### Přidáno
- Globální vynucení tichých hodin pro notifikace.
- Inteligentní hlídání servisu po termínu (overdue) s cool-off periodou.
- Optimalizace `onNewEvent` pro škálování.

## [0.0.32] - 2026-02-14
### Technické
- Reimplementace Google Sign-In pro Android 14.
- Odstranění nespolehlivého webového fallbacku na nativních platformách.
- 15s timeout pro nativní plugin (prevence zamrznutí).
- Detekce "Silent Failure" s nápovědou pro SHA-1 klíče.

## [0.0.31] - 2026-02-13
### Přidáno
- Zobrazení verze aplikace ve footeru.
- Statistiky celkového počtu uživatelů a aut v sekci Info.
### Opraveno
- Oprava překrývání štítků "Na prodej" a statusů na kartách aut.

## [0.0.30] - 2026-02-13
### Přidáno
- Správa akcí pro organizátory (možnost upravit nebo smazat budoucí akci).
- Základní systém odznaků (Fáze 0 - BK Team Badge).
