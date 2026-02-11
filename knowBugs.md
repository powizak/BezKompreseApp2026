# Known Bugs

- Chrome v iOS - nefunkční tracker - prohližeč si nedokáže říct o oprávnění
- nutno dodělat lepší meziokno pro načítání - nyní se načítá s malým spinnerem (to samé po přihlášení) 
- **Omezení načítání obrázků:** Při načítání velkého množství profilových fotek (např. v seznamu uživatelů) může google/firebase vrátit chybu 429 (Too Many Requests). Toto je řešeno omezením souběžného stahování obrázků na max. 3 najednou, což může mírně zpomalit načítání, ale předchází chybám.
- Mobilní Chrome občas vkládá extra bílé znaky do vyhledávacího pole u aut.ě
- uživatelé mohou při zadávání auta přidat i whitespace, který pak kazí vyhledávání
- nesprávné zobrazování fotek na Android (aut, profilovek)