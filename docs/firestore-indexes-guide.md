# Firestore Composite Indexes — Průvodce

## Kdy je potřeba index?

Firestore automaticky vytváří indexy pro dotazy na **jeden** field. Pro dotazy na **dva a více** fieldů je potřeba **composite index**.

## Jak zjistit, že index chybí?

1. **Firebase Console → Functions → Logs** — při volání funkce se objeví chyba:
   ```
   FAILED_PRECONDITION: The query requires an index.
   You can create it here: https://console.firebase.google.com/...
   ```
2. Klikni na odkaz v chybové zprávě — Firebase automaticky předvyplní index

## Jak vytvořit index ručně

1. Jdi na [Firebase Console](https://console.firebase.google.com/)
2. Vyber projekt → **Firestore Database** → **Indexes** tab
3. Klikni **Create Index**
4. Nastav:
   - **Collection**: název kolekce (např. `users`)
   - **Fields**: přidej pole v pořadí, jak je používáš v dotazu

## Indexy potřebné pro notifikace

### `onNewEvent` — dotaz na users kolekci

| Collection | Field 1 | Field 2 | Typ |
|------------|---------|---------|-----|
| `users` | `notificationSettings.enabled` (Ascending) | `notificationSettings.newEvents.enabled` (Ascending) | Composite |

> [!TIP]
> Po deployi funkce stačí vytvořit jednu novou akci — pokud se v logách objeví chyba s odkazem na index, klikni na odkaz a Firebase jej vytvoří za tebe. Pokud funkce projde bez chyby, index není potřeba (Firestore už má dostatečné automatické indexy).

## Ověření

Po vytvoření indexu počkej **2–5 minut** na jeho sestavení. Stav vidíš v **Indexes** tabu (Status: "Building" → "Enabled").
