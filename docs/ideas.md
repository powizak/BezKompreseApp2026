# Myšlenky pro budoucí funkce

## Pokročilé filtrování v bazaru
- vymyslet a přidat nějaké pokročilé filtrování v bazaru? dle čeho? až v případě, že bude velký zájem o bazar

## 1. Správa Vozidla a Utility (Drivvo/Fuelio style)
#### ⛽ Rozšířené sledování Spotřeby (Fuel Tracking)
Současný stav: Servisní knížka řeší opravy, seznam tankování pak spotřebu

#### ✅ IMPLEMENTOVÁNO: 
- Statistiky: průměrná spotřeba, trend spotřeby (nahoru/dolů/stabilní), cena za km
- Graf: Vývoj spotřeby (line chart) za posledních 12 měsíců
- Graf: Náklady palivo vs servis (stacked bar chart) za posledních 12 měsíců
- Automatický odečet: Při zadání tankování se automaticky aktualizuje stav tachometru v autě
- **Indikátory tankování**: Ikony plné/částečné nádrže v historii
- **Korekce výpočtu**: Správná akumulace litrů přes částečná tankování a výpočet průměru z první/poslední plné nádrže
- Zobrazení tachometru na kartě auta v garáži
- **Status aut**: Sezónní, depozit, v renovaci, do šrotu, porucha, závodní speciál, daily, pracovní, služební

#### 🚀 Budoucí vylepšení:
- Kalkulačka dojezdu: Odhad, kolik km ujede s plnou nádrží
- Export dat do CSV/Excel
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
- **✅ Úprava a mazání akcí**: Možnost pro organizátora spravovat své akce (pouze budoucí).

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

#### ✅ Phase 2 - IMPLEMENTOVÁNO: 
- je žádoucí mít možnost přidat inzerát na auto i jako samostatný - nejen určením auta "na prodej" v úpravě vozidla. S tím, že pak nebude vidět detail auta, ale bude se to chovat, jako obyčejný inzerát
- zároveň je potřeba přidat možnost si zobrazit detail inzerátu (nejen pokud se jedná o auta z garáže, ale jakýkoliv typ inzerátu (stále platí, že auto z garáže přejde na kartu daného vozidla))
- podívat se také na kategorie bazaru - nyní jsou auta, poptávky a v poptávkách je pak i prodej dílů 
    - rozdělit na 3 záložky - neměnit UI - prostě přidat další přepínač, takto to vypadá super (nyní jsou prodej aut a poptávky), a to: prodej aut, poptávky (díly, auta, služby), nabídky (díly, auta, služby)
- u poptávek a nabídek je potřeba přidat možnost filtrování podle kategorie (díly, auta, služby)
- v případě, že je auto na prodej, zobrazí se popis inzerátu (je to již parametr auta) i na kartě vozidla (/car)
-  pro marketplace také nejspíše nefunguje úplně správně převod fotek - zůstala tam fotka "large.webp" s velikostí téměř 5MB -> zkontrolovat


### Rozšíření funkcí inzerce
- Ověření Bez Komprese - možnost si zažádat o certifikát např. na základě VIN
- Možnost si zažádat o certifikát na základě prohlídky v servisu Bez Komprese

### 🚀 Vylepšení UX
- Přidat značku, zda již někdo přečetl zprávu či nikoliv (pro toho, kdo si ji má přečíst - v seznamu zpráv)
- Dodělat swipe na všech stránkách pro vrácení se zpět pro Android (některé Android to tak mohou mít nastavené - stejné jako v knownbugs)
- Pro bazar udělat vlastní rychlý dialog bez nutnosti otevírat novou stránku daného inzerátu (bacha, máme 2 typy - auta z profilu + inzeráty samotné)
- Při přidávání fotek zobrazit jejich náhled před uložením, aby se nestalo, že uživatel omylem nahraje jinou fotku
- Ve feedu zobrazit u každého příspěvku možnost nejen prokliku, ale jen zkopírování odkazu

- ✅ **Přidat do footeru vedle "Not affilitated officially." verzi aplikace** - IMPLEMENTOVÁNO
- ✅ **Přidat do "info" - celkový počet uživatelů / aut v aplikaci** - IMPLEMENTOVÁNO

### ✅ Gamifikace - IMPLEMENTOVÁNO (Fáze 0,1)
#### ✅ Fáze 0 - IMPLEMENTOVÁNO
- ** BK Team Badge - IMPLEMENTOVÁNO**: Speciální odznak pro členy týmu na jejich profilech. 
#### ✅ Fáze 1 - IMPLEMENTOVÁNO
- **Odznaky (Badges)**: "High Miler", "Wrench Wizard", "Early Adopter", "Socialite", "Organizer" atd.
- **Technologie**: Transakční udělování (prevence race conditions), automatická deduplikace, retroaktivní kontroly při načtení profilu.
- **UI**: Karta "Odznaky" na profilu, detailní modály, počítadlo unikátních odznaků.
- Levely podle najetých km a podle počtu záznamů, účasti na srazech atd.
- Pro všechny, co se podíleli na testování dát odznak "Testovací jezdec" 
- Odznaky možno "vystavit" 3 na profilu
- Uživatel (i ostatní) uvidí všechny své odznaky na další kartě na svém profilu (jako je karta nastavení) s tím, že uživatel samotný uvidí i další, které existují zašedlé, když je ještě nemá
- Na každý odznak bude možno kliknout (vyjede pop-up, jako máme např. přidávání záznamů tankování, jen bez možnosti úprav) s tím, že se zobrazí informace o daném odznaku - název, popis, za co byl udělen, kdy byl udělen
##### Vytvořit databázi odznaků


#### Fáze 2
- Sbírání BezKomprese známeček -> možnost si vybrat za známky "dárek" -> sleva na eshop nebo samolepka atd. 

#### Fáze 3
- Fight kartiček ve stylu "Kdo má lepší auto" - na základě statistik aut
- Soutěže - nejlepší tuning, nejlepší fotka, nejlepší video, nejlepší úprava, nejvíce najetých kilometrů atd. 

## 3. Technická Vylepšení (Technical)
### 🩺 OBD-II Integrace (Budoucí rozvoj)
- Možnost spárovat s Bluetooth OBD-II adaptérem (např. přes Web Bluetooth API, pokud to prohlížeč dovolí, nebo manuální import).
- Automatické načtení chybových kódů (DTC) do "Servisní knížky" jako koncept záznamu.

### 📱 PWA a Offline Mode
- Vylepšit cachování map pro "Tracker" v místech bez signálu (časté na okreskách).
- Synchronizace servisní knížky (offline-first), aby šlo zapisovat i v garáži bez Wi-Fi.  

### 🗂️ Car Filter Index (10k+ aut)
- Při překročení ~5000 aut vytvořit Cloud Function, která bude udržovat jeden `car-filter-index` dokument ve Firestore s relační mapou `{ make → { model → engines[] } }`.
- Tím se redukuje počáteční načtení filtrů na 1 read místo N reads (všech aut).

### 📄 Changelog
- Kompletní historii změn najdete v souboru [changelog.md](changelog.md).

