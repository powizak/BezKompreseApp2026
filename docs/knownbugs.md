# Known Bugs
- Chrome v iOS - nefunkční tracker - prohližeč si nedokáže říct o oprávnění

 - uživatelé mohou ve starých verzích aplikace (Android) zadávat data s whitespace na konci -> kazí to filtrování -> nutno ještě jednou vyčistit scriptem

## Nastavení notifikací
- Pro zapnutí notifikací v nové verzi je vždy potřeba jít do nastavení v profilu a notifikace vypnout a zapnout - po prvním spuštění apliakce je žádoucí, aby si aplikace o daná oprávnění řekla sama (vždy, pokud je nemá povolené) a případně kontrolovala, zda je má povolené v případě změny v nastavení v aplikaci (to nyní funguje)

## Nahrávání fotek nezobrazuje náhled
- v případě přidávání fotek v bazaru (možná i v autech) se nezobrazuje náhled fotky po výběru fotky od uživatele

## 🔴 Firebase Storage Rules Missing

**Status**: Open  
**Severity**: Critical  
**Date**: 2026-02-17

Firebase Storage nemá v repu soubor `storage.rules` a `firebase.json` neobsahuje sekci `"storage"`. To znamená, že pravidla pro Storage se nespravují přes deploy a jsou nastavena přímo v Firebase Console.

**Dopad**: Internalizované profilové fotky (`users/{uid}/profile.webp`) musí mít pravidla nastavená ručně v Console. Pokud nejsou, ostatní uživatelé nevidí profilové fotky.

**Řešení**: Vytvořit `storage.rules` s pravidly:
- Read: všichni authenticated uživatelé
- Write: pouze vlastník (`users/{userId}/*`)
- Přidat `"storage": { "rules": "storage.rules" }` do `firebase.json`
