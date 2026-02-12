# Known Bugs

- Chrome v iOS - nefunkční tracker - prohližeč si nedokáže říct o oprávnění
- **Omezení načítání obrázků:** Při načítání velkého množství profilových fotek (např. v seznamu uživatelů) může google/firebase vrátit chybu 429 (Too Many Requests). Toto je řešeno omezením souběžného stahování obrázků na max. 3 najednou, což může mírně zpomalit načítání, ale předchází chybám.
- YouTube API volá drahou funkci - tedy dojde denní limit a nezorbazují se data - nutno předělat na výčet z playlistu nahraná videa