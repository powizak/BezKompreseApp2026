# Known Bugs

- Chrome v iOS - nefunkční tracker - prohližeč si nedokáže říct o oprávnění
- **Omezení načítání obrázků:** Při načítání velkého množství profilových fotek (např. v seznamu uživatelů) může google/firebase vrátit chybu 429 (Too Many Requests). Toto je řešeno omezením souběžného stahování obrázků na max. 3 najednou, což může mírně zpomalit načítání, ale předchází chybám.
 -> bude přepracováno v další verzi

 - uživatelé mohou ve starých verzích aplikace (Android) zadávat data s whitespace na konci -> kazí to filtrování -> nutno ještě jednou vyčistit scriptem

- je žádoucí mít možnost přidat inzerát na auto i jako samostatný - nejen proklikem z garáže s tím, že pak nebude vidět detail auta, ale bude se to chovat, jako obyčejný inzerát
- zároveň je potřeba přidat možnost si zobrazit detail inzerátu (nejen pokud se jedná o auta z garáže)
- podívat se také na kategorie bazaru - nyní jsou auta, poptávky a v poptávkách je pak i prodej dílů - potřeba domyslet
- pro marketplace také nejspíše nefunguje úplně správně převod fotek - zůstala tam large s velikostí téměř 5MB