# Changelog

Všechny důležité změny v projektu jsou zaznamenány v tomto souboru.

## [0.0.55] / [_2026_02_28] - 2026-02-28
### Přidáno
- **Vizuální nápověda scrollování v profilu**: Zlepšeno UI/UX (gradienty a dynamické šipky) pro naznačení scrollovatelných záložek s autokorekcí pro PC displeje za použití ResizeObserver a asynchronní inicializace z DOMu.

## [0.0.54] / [_2026_02_27] - 2026-02-27
### Opraveno
- **Tracker Synchronizace**: Kompletně vyřešeno odpojování Firebase u Live Tracker mapy. Sdílení polohy a viditelnost na mapě funguje nyní stoprocentně spolehlivě i při odlišných časech zařízení na mobilech.
- **SOS Notifikace a Odezva**: Opraven pád Cloud Functions pro záchranné push notifikace a chybějící oprávnění u SOS tlačítek. Nyní plně funkční obousměrná komunikace (zavolání i odpověď).

## [0.0.53] / [_2026_02_26] for Android app - 2026-02-26
### Přidáno
- **Notifikace v popředí**: Nativní bannerové upozornění pro Android i při používání aplikace, které přesměruje uživatele na správnou obrazovku.
- **Deduplikace notifikací na přátele**: Implementován 24hodinový cooldown pro žádosti o přátelství, který zabraňuje zahlcování.

## [0.0.52] / [_2026_02_25] for Android app - 2026-02-25
### Přidáno
- **Onboarding Wizard**: Zaveden nový třístupňový úvodní průvodce (Welcome, Tracker & SOS, Notifications), který nahrazuje starý dialog a agresivní žádosti.
- **Kontextová Poloha**: Z důvodu ochrany soukromí a splnění podmínek Apple App Store (5.1.1) je nyní žádost o polohu vyvolána až při reálném prvním otevření mapy (Live Trackeru), nikoliv hned po spuštění.
- **Synchronizace Oprávnění s OS**: Aplikace nyní inteligentně detekuje, pokud uživatel zakázal notifikace v nastavení samotného telefonu (OS), promítne tento stav do `Profilu -> Nastavení` a navede uživatele zpět do nastavení systému, pokud je chce znovu zapnout.
- **Přečištění UI**: Odstraněn původní 7denní opakující se notifikační prompt. Nyní je vše řešeno čistě na začátku a případně pak v nastavení profilu.

## [0.0.51] / [_2026_02_24] for Android app - 2026-02-24
### Přidáno
- **Chat Navigace**: Možnost bezpečně zavřít překryvné okno (Overlay) chatu pomocí hardwarového tlačítka "zpět" na Androidu nebo nativního swipe-back gesta na iOS, aniž by došlo k nežádoucí běžné navigaci v aplikaci.

## [0.0.50] / [_2026_02_23v2] for Android app - 2026-02-23
### Přidáno
- **Chat**: Přidána možnost prokliknout se z hlavičky okna chatu přímo na detailní profil uživatele.
- **Sdílení**: Možnost zkopírovat odkaz nebo použít nativní sdílení u každého příspěvku na hlavní stránce.
- **Zabezpečení a stabilita:** Aktualizace NPM závislostí na bezpečnější minor/patch verze (včetně Capacitor 8.1.0, Firebase, Vite a React) a oprava zranitelností hlášených bezpečnostním auditem. Ponechána stabilní verze Tailwind CSS V3 pro zachování integrity UI.

## [0.0.49] / [_2026_02_22] for Android app - 2026-02-22 
### Přidáno
- **Proaktivní notifikace**: Implementován primer dialog (představení benefitů) před samotnou systémovou žádostí o oprávnění k notifikacím.
- **Web Push podpora**: Kompletní zprovoznění notifikací v prohlížeči pomocí VAPID klíče a Service Workeru.
- **Automatická registrace**: Zařízení se nyní po přihlášení a udělení souhlasu automaticky zaregistruje k odběru push zpráv (FCM).
- **Silent Refresh**: Aplikace při každém návratu do popředí (App Resume) tiše ověří a případně obnoví notifikační token.

### Opraveno
- **Fix Info statistik**: Statistiky počtu uživatelů a aut se již nesnaží načítat, pokud uživatel není přihlášen (řešení chyby oprávnění ve Firestore).
- **Stabilita registrace**: Opraven pád registrace zařízení na webu, který způsoboval nedostupný VAPID klíč.

## [0.0.48] - 2026-02-22
### Přidáno
- **Vylepšené tankování (Křížové výpočty)**: Implementována inteligentní logika pro automatický dopočet polí (Litrů, Ceny za litr, Celkové ceny).
- **Volitelný tachometr**: Stav tachometru je nyní povinný pouze u plného tankování.
- **Robustní statistiky**: Výpočty spotřeby a řazení záznamů byly upraveny tak, aby korektně pracovaly i se záznamy bez vyplněného tachometru.
- **Ochrana dat**: Automatická aktualizace stavu tachometru vozidla se provede pouze při zadání platné (vyšší) hodnoty.
- **Oprava závislostí**: Přidána chybějící závislost `react-is`.

### Opraveno
- **Fix mazání statusu vozidla**: Opravena chyba, kdy při volbě "Bez statusu" v garáži zůstával původní status.

## [0.0.46] - 2026-02-22
### Přidáno
- **Mobilní navigace (Android & iOS)**: Kompletní podpora pro hardware tlačítko zpět na Androidu a nativní swipe-back gesto na iOS.
- **Inteligentní tlačítko zpět**: Na Androidu stisknutí "Zpět" nyní logicky naviguje v historii aplikace (zavření aplikace proběhne pouze na hlavní domovské stránce `/`).
- **iOS Swipe Gesto**: Aktivována nativní podpora swajpnutí z levého okraje pro návrat zpět v historii, sjednocující chování aplikace se standardy platformy Apple.
- **Stabilizace**: Oprava chování, kdy tlačítko zpět na Androidu předčasně ukončovalo celou aplikaci.

## [0.0.45] - 2026-02-21
### Přidáno
- **Sjednocení designu hlaviček**: Všechny hlavní stránky (`/cars`, `/market`, `/service-book`, `/fuel-tracker`, `/events`, `/garage`) mají nyní sjednocený vizuální styl hlaviček (včetně ikony, konzistentní typografie a bílého kontejneru se stínem) pro lepší UX a profesionální vzhled aplikace.
- **Integrace ovládacích prvků**: Tlačítka pro přidávání záznamů nebo přepínání zobrazení (např. seznam/mapa v `/events`) jsou nyní elegantně integrována přímo do bloku hlavičky.

## [0.0.44] - 2026-02-20
### Opraveno
- **Fix vyhledávání uživatelů**: Kompletní reimplementace vyhledávání v komunitě. Uživatelé jsou nyní vyhledáváni pomocí `searchKeys` prefixů, což umožňuje hledání podle aktuálního jména v profilu i původního jména z Google účtu.
- **Oprava persistence jména**: Vyřešen bug v `AuthService`, který při každém přihlášení přepsal vlastní přezdívku uživatele jeho původním Google jménem.
- **Výkon**: Vyhledávání je nyní case-insensitive a podporuje hledání podle částí jmen (např. jen příjmení) s bleskovou odezvou Firestore.

## [0.0.43] - 2026-02-20
### Přidáno
- Optimalizace profilových fotek: nové nahrávané avatary jsou automaticky zmenšovány na ideální rozměr **130x130px** (WebP), což výrazně šetří datový přenos a úložný prostor.
- Zjednodušení datového modelu: profilová fotka (`photoURL`) je nyní opět reprezentována jako jednoduchý řetězec, což zlepšuje stabilitu UI komponent.
- Robustní fallback strategie: komponenta avatara nyní okamžitě a bezpečně využívá profilovou fotku z Google účtu, pokud uživatel nenahrál vlastní.
- Registrace známé chyby: Dokumentování problému s vyhledáváním uživatelů podle jména v `knownbugs.md`.

## [0.0.42] - 2026-02-19
### Opraveno
- Robustní výpočet spotřeby paliva: Algoritmus nyní správně započítává všechna tankování i v případě více záznamů ve stejný den (včetně kombinace částečného a plného tankování).
- Oprava řazení historie tankování: Záznamy ze stejného dne jsou nyní řazeny logicky podle nájezdu (novější nahoře).
- Zpřesnění výpočtu průměrné spotřeby celého vozidla pro případy s vícenásobným tankováním ve stejný den.

## [0.0.41] - 2026-02-18
### Přidáno
- Sjednocení pravidel nahrávání fotek (limit 15 MB, jedna komprese, WebP 70 %) pro celou aplikaci (Garáž, Marketplace, Události).
- Odstranění redundantní dvojí komprese v Marketplace (zrychlení nahrávání a zachování vyšší kvality).
- Aktualizované UI popisky s informací o maximální velikosti fotky a automatické konverzi do WebP.
- Prázdná garáž na vlastním profilu nyní zobrazuje CTA tlačítko „Přidat první auto" s odkazem do `/garage`.
- Nový štítek vozidla: **„Dárce orgánů"** (`donor`) — dostupný ve formuláři garáže a zobrazovaný jako rose badge na všech stránkách s auty.

## [0.0.40] - 2026-02-18
### Přidáno
- Vylepšení responzivity: oprava scrollování formulářů (tankování, bazar) při nízké výšce obrazovky (landscape na mobilu).
- UX vylepšení: tlačítka akcí v historii tankování jsou nyní viditelná vždy (nejen po najetí myší).

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
