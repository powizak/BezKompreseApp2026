# Myšlenky pro budoucí funkce

## 1. Správa Vozidla a Utility (Drivvo/Fuelio style)
#### ⛽ Rozšířené sledování Spotřeby (Fuel Tracking)
Současný stav: Servisní knížka řeší opravy, seznam tankování pak spotřebu
#### Novinky: 
- Statistiky servisů / spotřeby
- Grafy spotřeby (l/100km), cena za km, měsíční (roční) náklady na palivo vs. servis.
- Automatický odečet: Pokud uživatel zadá tankování, automaticky se aktualizuje stav tachometru v autě.

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

### 🛠️ Bazar a Marketplace
- Udělat vlastní stránku "Market" s dvěma záložkami - Prodej, Poptávka
- Poptávka: "Sháním X", ilustrační foto, dodatečné informace, požadovaná cena.
- Prodej aut: V sekci "Garáž" možnost označit celé auto na prodej. 
- Označení štítkem v seznamu aut (jako máme vlastněno)
- Možno kontaktovat vlastníka auta / poptávajícího přímo z marketu - otevře chat s daným uživatelem / založí nový, pokud ještě spolu nekomunikovali
- Přímo z inzeratu může vlastník označit auto jako "Prodané" - tedy vymaže inzerát a zároveň v garáži mu odznačí "Vlastněno"  


### 🏆 Gamifikace a "Build Threads"
- Odznaky (Badges): "High Miler" (nájezd 300k+), "Wrench Wizard" (více než 10 DIY záznamů), "Event Junkie" (účast na srazech) atd.

## 3. Technická Vylepšení (Technical)
### 🩺 OBD-II Integrace (Budoucí rozvoj)
- Možnost spárovat s Bluetooth OBD-II adaptérem (např. přes Web Bluetooth API, pokud to prohlížeč dovolí, nebo manuální import).
- Automatické načtení chybových kódů (DTC) do "Servisní knížky" jako koncept záznamu.

### 📱 PWA a Offline Mode
- Vylepšit cachování map pro "Tracker" v místech bez signálu (časté na okreskách).
- Synchronizace servisní knížky (offline-first), aby šlo zapisovat i v garáži bez Wi-Fi.  