# Myšlenky pro budoucí funkce

Tento soubor obsahuje nápady na rozvoj aplikace. Je rozdělen do sekce **TODO** (plánováno/ve frontě) a **IMPLEMENTOVÁNO** (již historicky nasazeno do kódu).

---

## 📝 TODO (Nápady k realizaci)

### 🚗 Správa Vozidla a Utility

- **Předpokládaný servis**: Na základě dat z tankování a servisní knížky předpokládat, kdy bude potřeba další servis a ukazovat to uživateli v aplikaci a pokud to bude mít zapnuté jako notifikaci, pak upozornit notifikací na blížící se nutnost servisu.
- **Zadávání tankování fotkou**: Využít AI k načtení dat z účtenky a automatickému doplnění do formuláře tankování.
- **Export dat**: Podpora exportu statistik do CSV/Excel.
- **Mapa tankování**: Vizualizace, kde uživatel tankuje (frekvence, levnost).
- **Další typy paliva**: Podpora pro LPG, CNG, elektrická a hybridní auta.
- **Vylepšení pole motorizace**: U pole "engine" zavést buď kombinaci 2 polí (číslo + velká písmena), nebo našeptávač existujících hodnot pro sjednocení zadaných dat uživateli.
- **Audio Soundboard (Co to klepe?)**: Možnost nahrát 2 zvukové stopy přímo k profilu auta ("Cold Start" a "Revving"). Skvělé pro prezentaci motoru komunitě i jako forum pro komunitní audio-diagnostiku problémů.

### 👥 Komunita a Sociální Funkce

- **Stav přečtení v chatu**: Přidat indikátor u zprávy, zda ji druhá strana již přečetla.
- **Konvoj Mód**: Vylepšení Trackeru pro konkrétní akci – zobrazení pořadí aut v koloně, upozornění "ztratili jsme se", pokud se někdo odpojí.
- **Organizované Vyjížďky a Trasy**: Sdílení tras (GPX import/export).
- **Hodnocení silnic (Curated "Holy Grail" Roads)**: Rozšíření cest o hodnocení. Možnost označit úseky mapy jako "skvělá okreska" nebo "samá díra". Vkládání konkrétních GPX úseků a jejich hodnocení ve formátu Michelin průvodce (kvalita asfaltu, hustota provozu, panorama).
- **Likování aut**: Možnost každému autu dát palec hore, srdíčko a další emotikony (třeba 5) a zobrazovat to na kartě vozidla, kolik toho dané auto má -> udělat z toho odznak.
- **Spotter Mode (Digitalizace pozdravu na ulici)**: Vygenerování unikátního prohledného QR kódu na okno/auto. Požití jiným jedincem (i bez appky) načte profil auta s akčním tlačítkem pro udělení "respektu/lajku" a výzvou ke stažení. Majitel získává odznaky za street cred a notifikace o spotech. Uvnitř komunity i offline.
- **Wrench-hub & Local Garage (Sdílení kompetencí)**: Rozšíření mapy o komunitní dovednosti a nářadí. Zobrazení ochotných členů v okolí (např. "mám zvedák", "mám diagnostiku", nebo "hledám pomoc s výměnou ramen, platím pizzu"). Návrat ke kořenům garážových komunit.

- **Gamifikace (další fáze)**:
  - Fáze 2: Sběr speciálních BezKomprese "známek" za aktivitu -> výměna za dárky (slevy, samolepky).
  - Fáze 3: "Fight" aut formou kartiček na základě statistik aut a soutěže na nejlepší tuning, fotku, video atd.

### 🏪 Bazar a Marketplace

- **Ověřené inzeráty (Bez Komprese Tag)**: Získání certifikátu na základě zjištění přes automobilové zdroje (VIN apod.) (LEVEL1) a nebo přímo osobní prohlídky v servisu (LEVEL2).
- **TOPování inzerátů**: Za drobný poplatek možnost být prvních 7 dní na předních příčkách v dané prodejní kategorii.
- **Rychlý popup dialog pro Bazar**: Otevírání malého náhledu bez nutnosti prokliku (pozor: musí umět renderovat jak auta z profilu, tak i raw samostatné inzeráty).
- **Pokročilé filtrování**: Přidat filtry vlastností, pokud bude bazar aktivně využíván.

### 🔧 Technická Vylepšení

- **PWA a Offline Mode**: Offline synchronizace Servisní knížky (pro použití uvnitř nezasíťované garáže) a lepší cachování map do Trackeru pro místa bez signálu.
- **OBD-II Integrace**: Spárovat aplikaci přes Bluetooth s OBD-II modulem a nacpat rovnou chybové kódy (DTC) do konceptu záznamu v Servisní knížce.
- **Car Filter Index**: Vytvořit Cloud Function pro index, pokud počet uživatelských aut vzroste nad 5000, minimalizace Firestore requestů pomocí stromové mapy.

---

## ✅ IMPLEMENTOVÁNO

### 🚗 Správa Vozidla a Utility

- **Tankování a spotřeba**: Dopočet hodnot a křížový výpočet litrů a ceny s pamětí pro úpravy. Volitelné kilometry s ošetřením nulových tachometrů. Zvládnutí částečného tankování.
- **Statistiky**: Výpočty průměru spotřeby z první a poslední plné nádrže, trend spotřeby, spočtená částka za kilometr.
- **Grafy v profilu**: Vývoj spotřeby měsíčně a srovnání nákladů na servis vs. palivo.
- **Tachometr z tankování**: Automatická aktualizace u vozidla v garáži a zobrazení kilometrů přímo na hlavní kartě auta.
- **Indikátory tankování**: Zobrazení ikonek (plná vs. částečná nádrž) u každého výpočtu.
- **Statusy vozidel**: (Sezónní, depozit, v renovaci, porucha, závodní speciál, daily atd.). Zobrazeno jako badge.
- **Obrázky & UX**: Náhled nahraných profilovek před potvrzením. Sjednocený vizuální styl hlaviček.

### 👥 Komunita a Sociální Funkce

- **Onboarding Wizard**: Třístupňový průvodce (Welcome, Tracker/SOS, Notifikace) pro nové uživatele.
- **Tracker na pozadí**: Běh Live Trackeru na pozadí (Foreground Service napříč mobilem a Local notifications) i při zamknutém displeji.
- **Proximity Alerts**: Lokální notifikace na kolemjedoucí uživatele v libovolně nastavitelném rádiusu (1-100 km).
- **Kopírování a sdílení**: U příspěvků na titulní straně a v bazaru přidána možnost nativního sdílení (Android/iOS) nebo zkopírování odkazu do schránky (Web).
- **Chat s uživateli**: Live chat v celé aplikaci, vyvolání chat panelu pro komunikaci s majiteli z marketplace, udržování měsíční historie a navigační proklik z hlavičky na profil společníka. Upozornění systémovými Push notifikacemi.
- **Help Beacon (SOS)**: Community assist – lokalizace do 50 km s plovoucím SOS tlačítkem, detailní statusy krize, a akční tlačítka.
- **Digitální Kaslík (Reminder Status)**: Automatické hlídání platností např. STK a dálniční známky před limitem.
- **Databáze Akcí a Trackdays**: Oficiální a vlastní akce (např. Minisraz, Vyjížďka). Tvorba a mazání ze strany komunity. Filtrování kalendáře.
- **Mobilní gesta**: Nativní swipe (iOS) a Android HW Back button k opuštění pohledu či bezpečnému zavření overlay chatu před zavřením programu.
- **Footer a Info**: Verzionování a rychlý odpočet zaregistrovaných aut/uživatelů pro informovanost aplikace.
- **Gamifikace Fáze 0 a 1**: Komplexní systém udělení odznaků (BK Team Badge, High Miler, aj.) opatřený transakčním lockem a retroaktivní deduplikací ocenění přes user profil.

### 🏪 Bazar

- **Marketplace**: Založen bazar rozdělený na Prodej aut, Poptávky a Nabídky s dalším filtrováním podle kategorie zboží a auto-vyhledáváním hesel.
- **Inzeráty a Garáž**: Plná svoboda (prodat konkrétní vozidlo přímo z profilové garáže) versus zřídit stand-alone off-app vložení poptávky nebo prodeje.
- **Workflow prodeje**: Označení existujícího vozidla jako "prodaného" jej přeřadí pod kapotu, a zároveň schová případný bazarový inzerát. Vlastnosti inzerátu propisovány i do car profilu při prodávání auta z garáže.

### 🔧 Technická Vylepšení

- Sjednoceno ukládání fotek, komprese formátu za letu do WebP se 70% redukcí velikosti a limit formátem napříč webem až do objemu max 15MB upload (šetřeno UI storage v Firebase).
- Historie dokumentace se separovala a loguje se přímo do souboru `changelog.md` pro zmenšení duplicitních nápadních tabulek.
