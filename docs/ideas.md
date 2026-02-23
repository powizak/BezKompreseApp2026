# Myšlenky pro budoucí funkce

Tento soubor obsahuje nápady na rozvoj aplikace. Je rozdělen do sekce **TODO** (plánováno/ve frontě) a **IMPLEMENTOVÁNO** (již historicky nasazeno do kódu).

---

## 📝 TODO (Nápady k realizaci)

### 🚗 Správa Vozidla a Utility
- **Zadávání tankování fotkou**: Využít AI k načtení dat z účtenky a automatickému doplnění do formuláře tankování.
- **Kalkulačka dojezdu**: Odhad, kolik km ujede s plnou nádrží.
- **Export dat**: Podpora exportu statistik do CSV/Excel.
- **Mapa tankování**: Vizualizace, kde uživatel tankuje (frekvence, levnost).
- **Další typy paliva**: Podpora pro LPG, CNG, elektrická a hybridní auta.
- **Vylepšení pole motorizace**: U pole "engine" zavést buď kombinaci 2 polí (číslo + velká písmena), nebo našeptávač existujících hodnot pro sjednocení zadaných dat uživateli.

### 👥 Komunita a Sociální Funkce
- **Organizované Vyjížďky a Trasy**: Sdílení tras (GPX import/export).
- **Konvoj Mód**: Vylepšení Trackeru pro konkrétní akci – zobrazení pořadí aut v koloně, upozornění "ztratili jsme se", pokud se někdo odpojí.
- **Hodnocení silnic**: Možnost označit úseky mapy jako "skvělá okreska" nebo "samá díra".
- **Tracker na pozadí**: Možnost povolit běh aplikace na pozadí, tracker bude vysílat lokaci i při zamčeném telefonu (bude vyžadovat aktivní notifikaci systému).
- **Stav přečtení v chatu**: Přidat indikátor u zprávy, zda ji druhá strana již přečetla.
- **Otestování UI chatu (Mobil)**: Zkontrolovat na menších mobilech chování klávesnice.

- **Gamifikace (další fáze)**:
  - Fáze 2: Sběr speciálních BezKomprese "známek" za aktivitu -> výměna za dárky (slevy, samolepky).
  - Fáze 3: "Fight" aut formou kartiček na základě statistik aut a soutěže na nejlepší tuning, fotku, video atd.

### 🏪 Bazar a Marketplace
- **Pokročilé filtrování**: Přidat filtry vlastností, pokud bude bazar aktivně využíván.
- **Ověřené inzeráty (Bez Komprese Tag)**: Získání certifikátu na základě zjištění přes automobilové zdroje (VIN apod.) nebo přímo osobní prohlídky v servisu.
- **TOPování inzerátů**: Za drobný poplatek možnost být prvních 7 dní na předních příčkách v dané prodejní kategorii.
- **Rychlý popup dialog pro Bazar**: Otevírání malého náhledu bez nutnosti prokliku (pozor: musí umět renderovat jak auta z profilu, tak i raw samostatné inzeráty).

### 🔧 Technická Vylepšení
- **OBD-II Integrace**: Spárovat aplikaci přes Bluetooth s OBD-II modulem a nacpat rovnou chybové kódy (DTC) do konceptu záznamu v Servisní knížce.
- **PWA a Offline Mode**: Offline synchronizace Servisní knížky (pro použití uvnitř nezasíťované garáže) a lepší cachování map do Trackeru pro místa bez signálu.
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
- **Kopírování a sdílení**: U příspěvků na titulní straně a v bazaru přidána možnost nativního sdílení (Android/iOS) nebo zkopírování odkazu do schránky (Web).
- **Chat s uživateli**: Live chat v celé aplikaci, vyvolání chat panelu pro komunikaci s majiteli z marketplace, udržování měsíční historie a navigační proklik z hlavičky na profil společníka. Upozornění systémovými Push notifikacemi.
- **Help Beacon (SOS)**: Community assist – lokalizace do 50 km s plovoucím SOS tlačítkem, detailní statusy krize, a akční tlačítka.
- **Digitální Kaslík (Reminder Status)**: Automatické hlídání platností např. STK a dálniční známky před limitem.
- **Databáze Akcí a Trackdays**: Oficiální a vlastní akce (např. Minisraz, Vyjížďka). Tvorba a mazání ze strany komunity. Filtrování kalendáře.
- **Mobilní gesta**: Nativní swipe (iOS) a Android HW Back button k opuštění pohledu před zavřením programu.
- **Footer a Info**: Verzionování a rychlý odpočet zaregistrovaných aut/uživatelů pro informovanost aplikace.
- **Gamifikace Fáze 0 a 1**: Komplexní systém udělení odznaků (BK Team Badge, High Miler, aj.) opatřený transakčním lockem a retroaktivní deduplikací ocenění přes user profil.

### 🏪 Bazar
- **Marketplace**: Založen bazar rozdělený na Prodej aut, Poptávky a Nabídky s dalším filtrováním podle kategorie zboží a auto-vyhledáváním hesel.
- **Inzeráty a Garáž**: Plná svoboda (prodat konkrétní vozidlo přímo z profilové garáže) versus zřídit stand-alone off-app vložení poptávky nebo prodeje.
- **Workflow prodeje**: Označení existujícího vozidla jako "prodaného" jej přeřadí pod kapotu, a zároveň schová případný bazarový inzerát. Vlastnosti inzerátu propisovány i do car profilu při prodávání auta z garáže.

### 🔧 Technická Vylepšení
- Sjednoceno ukládání fotek, komprese formátu za letu do WebP se 70% redukcí velikosti a limit formátem napříč webem až do objemu max 15MB upload (šetřeno UI storage v Firebase).
- Historie dokumentace se separovala a loguje se přímo do souboru `changelog.md` pro zmenšení duplicitních nápadních tabulek.
