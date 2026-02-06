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
### 🚗 Organizované Vyjížďky a Trasy (Group Rides)
- Sdílení tras: Uživatelé mohou vytvořit a nasdílet trasu vyjížďky (GPX import/export).
- Konvoj Mód: Vylepšení Trackeru pro konkrétní akci – vidíte pořadí aut v koloně, upozornění "ztratili jsme se" pokud se někdo odpojí.
Hodnocení silnic: Uživatelé mohou označit úseky jako "skvělá okreska" nebo "samá díra".

### Help Beacon: Uživatel v nouzi (porucha, prázdná nádrž) může vyslat signál.
- 🆘 S.O.S. Tlačítko (Community Assist)
- Uživatelům v okolí (např. do 50 km) přijde notifikace "Fellow petrolhead needs help".
- Možnost definovat, co potřebuji (nářadí, startovací kabely, odvoz).
- Možnost označit událost různými stavy (aktuální, pomoc na cestě, vyřešeno)
- Možno označit ikonkami různé typy problémů (porucha, prázdná nádrž, nehoda, ...)

### Databáze trackdays
- v ČR není aktuálně žádná funkční
- Další typ akce, které jsou již momentálně definované
- Možno filtrovat přímo na mapě či v seznamu
- Rozšířené informace o akci (cena, kapacita, odkaz na registraci)

### 🛠️ Bazar a Marketplace
- Prodej dílů: V sekci "Garáž" možnost označit díly (z historie servisu) nebo celé auto na prodej.
- Poptávka: "Sháním X pro Y".

### 🏆 Gamifikace a "Build Threads"
- Odznaky (Badges): "High Miler" (nájezd 300k+), "Wrench Wizard" (více než 10 DIY záznamů), "Event Junkie" (účast na srazech) atd.

## 3. Technická Vylepšení (Technical)
### 🩺 OBD-II Integrace (Budoucí rozvoj)
- Možnost spárovat s Bluetooth OBD-II adaptérem (např. přes Web Bluetooth API, pokud to prohlížeč dovolí, nebo manuální import).
- Automatické načtení chybových kódů (DTC) do "Servisní knížky" jako koncept záznamu.

### 📱 PWA a Offline Mode
- Vylepšit cachování map pro "Tracker" v místech bez signálu (časté na okreskách).
- Synchronizace servisní knížky (offline-first), aby šlo zapisovat i v garáži bez Wi-Fi.  