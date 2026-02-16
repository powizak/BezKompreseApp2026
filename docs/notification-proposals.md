# Návrh Nových Notifikací

Tento dokument shrnuje aktuální stav notifikací v aplikaci a navrhuje nové notifikace na základě nedávno přidaných funkcí.

---

## 📊 Aktuální Stav Notifikací

### Implementované Notifikace

| Notifikace | Soubor | Trigger | Nastavení |
|------------|--------|---------|-----------|
| 🚨 SOS Volání | `onSosBeacon.ts` | Vytvoření help beaconu | `sosAlerts` |
| 💬 Komentáře k akcím | `onEventComment.ts` | Nový komentář u akce | `eventComments` |
| 📅 Změny v akcích | `onEventUpdate.ts` | Změna data/místa akce | `eventChanges` |
| 👋 Nový přítel | `onFriendRequest.ts` | Přidání do přátel | `friendRequests` |
| 💬 Nové zprávy | `onNewChatMessage.ts` | Nová zpráva v chatu | `chatMessages` |
| 🏪 Bazar/Marketplace | `onMarketplaceListing.ts` | Nový inzerát/auto na prodej | `marketplaceNotifications` |
| 🚗 Digitální kaslík | `onVehicleReminderCheck.ts` | Scheduled (9:00 denně) | `vehicleReminders` |

### Nastavení v UI

```typescript
interface NotificationSettings {
    enabled: boolean;
    quietHours: { enabled: boolean; startHour: number; endHour: number; };
    newEvents: { enabled: boolean; types: EventType[]; };
    sosAlerts: boolean;
    friendRequests: boolean;
    eventComments: boolean;
    eventChanges: boolean;
    appUpdates: boolean;
    vehicleReminders: boolean;
    chatMessages: boolean;
    marketplaceNotifications: boolean;
    digestMode: boolean;
}
```

---

## 🆕 Navrhované Nové Notifikace

### 1. 🔧 Servisní Upomínky (VYSOKÁ PRIORITA)

**Popis:** Připomínky nadcházejícího servisu na základě `nextServiceMileage` nebo `nextServiceDate` ze servisní knížky.

**Trigger:** Scheduled function (denní kontrola) - **SJEDNOCENO s `checkVehicleReminders`**

**Datové zdroje:**
- `service-records` kolekce
- Pole `nextServiceMileage` a `nextServiceDate` v každém záznamu

**Implementační návrh:** Rozšíření existující funkce `onVehicleReminderCheck.ts`:

```typescript
// functions/src/notifications/onVehicleReminderCheck.ts

// Přidat kontrolu servisních záznamů do existující funkce
export const checkVehicleReminders = functions
    .region("europe-west1")
    .pubsub.schedule("0 9 * * *")  // 9:00 ráno (existující)
    .timeZone("Europe/Prague")
    .onRun(async () => {
        console.log("Starting vehicle & service reminder check...");
        
        // === EXISTUJÍCÍ: Digitální kaslík ===
        // STK, lékárnička, dálniční známka, povinné ručení
        // ... existující kód ...
        
        // === NOVÉ: Servisní upomínky ===
        const serviceRemindersSent = await checkServiceReminders(db, now);
        
        console.log(`Check complete. Vehicle: ${notificationsSent}, Service: ${serviceRemindersSent}`);
    });

// Nová helper funkce
async function checkServiceReminders(db: Firestore, now: Date): Promise<number> {
    // 1. Najít všechny aktivní service records s nextServiceDate/Mileage
    const serviceSnapshot = await db.collection("service-records")
        .where("nextServiceDate", ">=", now.toISOString())
        .get();
    
    // 2. Zkontrolovat:
    //    - Datum za 7 dní, 3 dny, 1 den
    //    - Mileage blížící se k limitu (porovnat s car.currentMileage)
    // 3. Odeslat notifikace (respektovat nastavení vehicleReminders)
    
    return sentCount;
}
```

**Nastavení:** Použít existující `vehicleReminders: boolean` (sjednoceno s Digitálním kaslíkem)

**UI text:**
- Title: "🔧 Servisní upomínka"
- Body: "{carName}: {title} - za 7 dní / za 500 km"

**Důvod:** Servisní knížka má funkci "Příští servis", ale chybí notifikace. Sjednocení s Digitálním kaslíkem šetří Firebase resources a zjednodušuje správu.

**Výhody sjednocení:**
- ✅ Jedna scheduled function (šetří Firebase free tier)
- ✅ Společné nastavení `vehicleReminders`
- ✅ Konzistentní čas odesílání (9:00 ráno)
- ✅ Snadnější údržba

---

### 2. 📅 Nová Akce Vytvořena (VYSOKÁ PRIORITA)

**Popis:** Notifikace uživatelům o nových akcích podle jejich preferencí typů.

**Trigger:** `onCreate` na `events` kolekce

**Implementační návrh:**

```typescript
// functions/src/notifications/onNewEvent.ts

export const onNewEventCreated = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onCreate(async (snap, context) => {
        const event = snap.data() as AppEvent;
        
        // Najít uživatele s newEvents.enabled a typ v newEvents.types
        const usersToNotify = await getUsersWithEventTypePreference(event.eventType);
        
        // Filtrovat tvůrce akce
        // Odeslat notifikace
    });
```

**Nastavení:** Již existuje `newEvents: { enabled: boolean; types: EventType[]; }`

**UI text:**
- Title: "📅 Nová akce: {eventTitle}"
- Body: "{eventType} - {date} v {location}"

**Důvod:** Nastavení `newEvents` existuje v UI, ale trigger není implementován. Uživatelé nemají přehled o nových akcích.

---

### 3. 🏆 Nový Odznak (STŘEDNÍ PRIORITA)

**Popis:** Notifikace při získání nového odznaku (gamifikace).

**Trigger:** Při zápisu do `user.badges[]` pole

**Implementační návrh:**

```typescript
// functions/src/notifications/onBadgeAwarded.ts

export const onBadgeAwarded = functions
    .region("europe-west1")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        const beforeBadges = before.badges || [];
        const afterBadges = after.badges || [];
        
        const newBadges = afterBadges.filter((b: UserBadge) => 
            !beforeBadges.some((old: UserBadge) => old.id === b.id)
        );
        
        if (newBadges.length > 0) {
            // Odeslat notifikaci
        }
    });
```

**Nastavení:**
```typescript
badgeNotifications: boolean;  // Přidat do NotificationSettings
```

**UI text:**
- Title: "🏆 Nový odznak!"
- Body: "Získal jsi odznak '{badgeName}' - {badgeDescription}"

**Důvod:** Gamifikace je implementována, ale uživatelé se nemusí dozvědět o nových odznacích.

---

### 4. 🆘 Změna stavu Help Beacon (STŘEDNÍ PRIORITA)

**Popis:** Notifikace tvůrci beaconu, když se změní stav (někdo jede pomoct / vyřešeno).

**Trigger:** `onUpdate` na `helpBeacons` kolekce

**Implementační návrh:**

```typescript
// functions/src/notifications/onBeaconStatusChange.ts

export const onBeaconStatusChange = functions
    .region("europe-west1")
    .firestore.document("helpBeacons/{beaconId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as HelpBeacon;
        const after = change.after.data() as HelpBeacon;
        
        // Detekovat změnu stavu
        if (before.status !== after.status) {
            if (after.status === 'help_coming') {
                // Notifikovat tvůrce: "{helperName} jede pomoct!"
            } else if (after.status === 'resolved') {
                // Notifikovat helper: "Beacon byl vyřešen"
            }
        }
    });
```

**Nastavení:** Použít existující `sosAlerts` nebo přidat `beaconStatusUpdates: boolean`

**UI text:**
- Title: "🚗 Někdo jede pomoct!"
- Body: "{helperName} reaguje na tvůj SOS signál"

**Důvod:** Uživatel v tísni neví, zda někdo reaguje na jeho beacon.

---

### 5. 👥 Účast na akci (STŘEDNÍ PRIORITA)

**Popis:** Notifikace organizátorovi akce, když se někdo přihlásí/odhlásí.

**Trigger:** `onUpdate` na `events` kolekce (změna `participants[]`)

**Implementační návrh:**

```typescript
// functions/src/notifications/onEventParticipation.ts

export const onEventParticipation = functions
    .region("europe-west1")
    .firestore.document("events/{eventId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as AppEvent;
        const after = change.after.data() as AppEvent;
        
        const beforeParticipants = before.participants || [];
        const afterParticipants = after.participants || [];
        
        const joined = afterParticipants.filter(p => !beforeParticipants.includes(p));
        const left = beforeParticipants.filter(p => !afterParticipants.includes(p));
        
        // Notifikovat organizátora
    });
```

**Nastavení:**
```typescript
eventParticipation: boolean;  // Přidat do NotificationSettings (pro organizátory)
```

**UI text:**
- Title: "👤 Nový účastník"
- Body: "{userName} se přihlásil na {eventTitle}"

**Důvod:** Organizátoři nemají přehled o zájmu o jejich akce.

---

### 6. 🚗 Změna statusu auta přátel (NÍZKÁ PRIORITA)

**Popis:** Notifikace, když přítel změní status auta na "Porucha" nebo "V renovaci".

**Trigger:** `onUpdate` na `cars` kolekce

**Implementační návrh:**

```typescript
// functions/src/notifications/onCarStatusChange.ts

export const onCarStatusChange = functions
    .region("europe-west1")
    .firestore.document("cars/{carId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data() as Car;
        const after = change.after.data() as Car;
        
        if (before.status !== after.status) {
            // Najít přátele vlastníka
            // Notifikovat o zajímavých změnách (breakdown, racing)
        }
    });
```

**Nastavení:**
```typescript
friendCarUpdates: boolean;  // Přidat do NotificationSettings
```

**UI text:**
- Title: "🚗 {friendName} má poruchu"
- Body: "{carName} - status změněn na 'Porucha'"

**Důvod:** Sociální aspekt - přátelé mohou nabídnout pomoc.

---

### 7. 💰 Výrazná změna spotřeby (NÍZKÁ PRIORITA)

**Popis:** Upozornění na náhlý nárůst spotřeby paliva (možná závada).

**Trigger:** Při přidání nového záznamu tankování

**Implementační návrh:**

```typescript
// V DataService při ukládání FuelRecord
// Porovnat s průměrem posledních 3 tankování
// Pokud spotřeba > průměr * 1.3, vytvořit notifikaci
```

**Nastavení:**
```typescript
consumptionAlerts: boolean;  // Přidat do NotificationSettings
```

**UI text:**
- Title: "⚠️ Zvýšená spotřeba"
- Body: "{carName}: Spotřeba stoupla na {consumption} l/100km (průměr: {avg})"

**Důvod:** Proaktivní upozornění na možnou závadu.

---

## 📋 Souhrn Navrhovaných Notifikací

| # | Notifikace | Priorita | Nastavení | Komplexita | Poznámka |
|---|------------|----------|-----------|------------|----------|
| 1 | Servisní upomínky | 🔴 VYSOKÁ | `vehicleReminders` (existuje) | Střední | Sjednoceno s Digitálním kaslíkem |
| 2 | Nová akce | 🔴 VYSOKÁ | `newEvents` (existuje) | Nízká | Jen přidat trigger |
| 3 | Nový odznak | 🟡 STŘEDNÍ | `badgeNotifications` (nové) | Nízká | - |
| 4 | Beacon status | 🟡 STŘEDNÍ | `sosAlerts` (existuje) | Nízká | - |
| 5 | Účast na akci | 🟡 STŘEDNÍ | `eventParticipation` (nové) | Střední | Pro organizátory |
| 6 | Status aut přátel | 🟢 NÍZKÁ | `friendCarUpdates` (nové) | Střední | Defaultně vypnuto |
| 7 | Spotřeba alert | 🟢 NÍZKÁ | `consumptionAlerts` (nové) | Střední | - |

---

## 🔧 Aktualizace NotificationSettings

```typescript
export interface NotificationSettings {
    // ... existující pole ...
    
    // Nová pole:
    badgeNotifications: boolean;    // Nové odznaky
    eventParticipation: boolean;    // Účastníci akcí (pro organizátory)
    friendCarUpdates: boolean;      // Status aut přátel
    consumptionAlerts: boolean;     // Spotřeba alert
    
    // Poznámka: serviceReminders používá existující vehicleReminders
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    // ... existující ...
    badgeNotifications: true,
    eventParticipation: true,
    friendCarUpdates: false,        // Defaultně vypnuto (může být spam)
    consumptionAlerts: true,
};
```

### UI Změny

V [`NotificationSettings.tsx`](src/components/NotificationSettings.tsx) aktualizovat popis `vehicleReminders`:

```tsx
<SettingRow
    icon={Car}
    title="Digitální kaslík a servis"
    description="STK, lékárnička, pojištění, servisní upomínky"
    enabled={settings.vehicleReminders}
    onToggle={() => onChange({ ...settings, vehicleReminders: !settings.vehicleReminders })}
    disabled={!settings.enabled}
/>
```

---

## 📝 Poznámky k Implementaci

### 1. Quiet Hours
Všechny nové notifikace by měly respektovat nastavení `quietHours`.

### 2. Digest Mode
Při zapnutém `digestMode` by se měly notifikace seskupovat (např. denní souhrn).

### 3. Firebase Free Tier
- Scheduled functions: 1 (`checkVehicleReminders`) - **zůstává 1** po sjednocení
- Nové triggery: `onNewEventCreated`, `onBadgeAwarded`, `onBeaconStatusChange`, `onEventParticipation`, `onCarStatusChange`

### 4. Indexy Firestore
Pro nové query může být potřeba přidat indexy:
- `service-records`: `ownerId` + `nextServiceDate`
- `cars`: `ownerId` + `status`

---

## ❓ K Implementaci

Prosím, vyberte které notifikace chcete implementovat:

1. [X] **Servisní upomínky** - Nejužitečnější, doporučuji jako první
2. [X] **Nová akce** - Nastavení existuje, chybí trigger
3. [X] **Nový odznak** - Gamifikace
4. [X] **Beacon status** - Užitečné pro SOS systém
5. [X] **Účast na akci** - Pro organizátory
6. [ ] **Status aut přátel** - Sociální funkce
7. [ ] **Spotřeba alert** - Proaktivní údržba
