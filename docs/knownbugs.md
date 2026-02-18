# Known Bugs
- Chrome v iOS - nefunkční tracker - prohližeč si nedokáže říct o oprávnění

 - uživatelé mohou ve starých verzích aplikace (Android) zadávat data s whitespace na konci -> kazí to filtrování -> nutno ještě jednou vyčistit scriptem

- některé stránky mají odlišné nadpisy - chceme sjednotit do stylu tracker či chats
![náhled nadpisu stránky /chats](image.png)

## Navigace v mobilních zařízeních
- na Android (možná i iOS) není funkční navigace pomocí navigačních tlačítek/gest

## Nahrávání fotek nezobrazuje náhled
- v případě přidávání fotek v bazaru (možná i v autech) se nezobrazuje náhled fotky po výběru fotky od uživatele

# Počítání spotřeby pro jednotlivé záznamy nefunguje správně
- spotřeba per tankování se počítá nejspíše pouze z posledních 2 záznamů, ačkoliv by se měla počítat ze všech tankování, která jsou mezi plnými nádržemi

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
