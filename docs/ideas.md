# Myšlenky pro budoucí funkce

## 1. Správa Vozidla a Utility (Drivvo/Fuelio style)
#### ⛽ Rozšířené sledování Spotřeby (Fuel Tracking)
Současný stav: Servisní knížka řeší opravy, seznam tankování pak spotřebu

#### ✅ IMPLEMENTOVÁNO: 
- Statistiky: průměrná spotřeba, trend spotřeby (nahoru/dolů/stabilní), cena za km
- Graf: Vývoj spotřeby (line chart) za posledních 12 měsíců
- Graf: Náklady palivo vs servis (stacked bar chart) za posledních 12 měsíců
- Automatický odečet: Při zadání tankování se automaticky aktualizuje stav tachometru v autě
- Zobrazení tachometru na kartě auta v garáži
- **Status aut**: Sezónní, depozit, v renovaci, do šrotu, porucha, závodní speciál, daily, pracovní, služební

#### 🚀 Budoucí vylepšení:
- Kalkulačka dojezdu: Odhad, kolik km ujede s plnou nádrží
- Export dat do CSV/Excel
- Srovnání s průměrnou spotřebou modelu (API?)
- Mapa tankování: Vizualizace kde uživatel tankuje (frequence/levnost)
- Podpora více typů paliva (LPG, CNG, elektrická, hybrid)

## 2. Komunitní a Sociální Funkce (Roadstr style)
Současný stav: Tracker ukazuje polohu, ale neumožňuje koordinaci. Návrh:

### ✅ Help Beacon - IMPLEMENTOVÁNO
### ✅ Digitální Kaslík (Reminder Status) - IMPLEMENTOVÁNO
Uživatel v nouzi (porucha, prázdná nádrž) může vyslat signál.
- 🆘 S.O.S. Tlačítko (Community Assist) - plovoucí tlačítko na mapě
- Uživatelům v okolí (do 50 km) se zobrazí beacon na mapě
- Možnost definovat typ problému (porucha, prázdná nádrž, nehoda, defekt, jiné)
- Možnost přidat popis situace
- Možnost označit událost různými stavy (aktivní, pomoc na cestě, vyřešeno)
- Ikonky pro různé typy problémů
- Tlačítko "Jedu pomoct!" pro ostatní uživatele
- Pulsující červený marker na mapě pro aktivní beacony

### 🚗 Organizované Vyjížďky a Trasy (Group Rides)
- Sdílení tras: Uživatelé mohou vytvořit a nasdílet trasu vyjížďky (GPX import/export).
- Konvoj Mód: Vylepšení Trackeru pro konkrétní akci – vidíte pořadí aut v koloně, upozornění "ztratili jsme se" pokud se někdo odpojí.
Hodnocení silnic: Uživatelé mohou označit úseky jako "skvělá okreska" nebo "samá díra".

### ✅ Databáze trackdays - IMPLEMENTOVÁNO (typ akce)
- v ČR není aktuálně žádná funkční
- Další typ akce, které jsou již momentálně definované
- Možno filtrovat přímo na mapě či v seznamu
- Rozšířené informace o akci (cena, kapacita, odkaz na registraci)

### ✅ Chat s uživateli - IMPLEMENTOVÁNO
- Uživatel může vyvolat stránku chatu, a tedy vidět své předchozí konverzace a vytvořit novou s ostatními uživateli
- Propojit rychlý chat s historií chatů (uchovávaných maximálně měsíc)
- Přidat notifikace na nové zprávy v chatu

### ✅ Bazar a Marketplace - IMPLEMENTOVÁNO
- Udělat vlastní stránku "Market" s dvěma záložkami - Prodej, Poptávka
- Poptávka: "Sháním X", ilustrační foto, dodatečné informace, požadovaná cena.
- Prodej aut: V sekci "Garáž" možnost označit celé auto na prodej. 
- Označení štítkem v seznamu aut (jako máme vlastněno)
- Možno kontaktovat vlastníka auta / poptávajícího přímo z marketu - otevře chat s daným uživatelem / založí nový, pokud ještě spolu nekomunikovali
- Přímo z inzeratu může vlastník označit auto jako "Prodané" - tedy vymaže inzerát a zároveň v garáži mu odznačí "Vlastněno"  

### Rozšíření funkcí inzerce
- Ověření Bez Komprese - možnost si zažádat o certifikát např. na základě VIN
- Možnost si zažádat o certifikát na základě prohlídky v servisu Bez Komprese

### 🚀 Vylepšení UX
- Přidat značku, zda již někdo přečetl zprávu či nikoliv (pro toho, kdo si ji má přečíst - v seznamu zpráv)
- Přidat do "info" - celkový počet uživatelů / aut v aplikaci? 

### 🏆 Gamifikace a "Build Threads"
- Odznaky (Badges): "High Miler" (nájezd 300k+), "Wrench Wizard" (více než 10 DIY záznamů), "Event Junkie" (účast na srazech) atd.
- Levely podle najetých km a podle počtu záznamů, účasti na srazech atd.
- Sbírání BezKomprese známeček -> možnost si vybrat za známky "dárek" -> sleva na eshop nebo samolepka atd. 
- Fight kartiček ve stylu "Kdo má lepší auto" - na základě statistik aut
- Soutěže - nejlepší tuning, nejlepší fotka, nejlepší video, nejlepší úprava, nejvíce najetých kilometrů atd. 


## 3. Technická Vylepšení (Technical)
### 🩺 OBD-II Integrace (Budoucí rozvoj)
- Možnost spárovat s Bluetooth OBD-II adaptérem (např. přes Web Bluetooth API, pokud to prohlížeč dovolí, nebo manuální import).
- Automatické načtení chybových kódů (DTC) do "Servisní knížky" jako koncept záznamu.

### 📱 PWA a Offline Mode
- Vylepšit cachování map pro "Tracker" v místech bez signálu (časté na okreskách).
- Synchronizace servisní knížky (offline-first), aby šlo zapisovat i v garáži bez Wi-Fi.  

### ✅ Internalizace profilových fotek - IMPLEMENTOVÁNO
- Automatické stažení Google profilovek na náš Firebase Storage.
- Obnova jednou za 30 dní.
- Eliminace 429 Rate Limitů od externích poskytovatelů.