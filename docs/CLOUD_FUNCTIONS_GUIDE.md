# Firebase Cloud Functions - Push Notifications Guide

Návod pro nastavení a testování push notifikací pomocí Firebase Cloud Functions.

## Předpoklady

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase projekt s aktivovaným Blaze plánem (Cloud Functions vyžadují platební plán)

## 1. Inicializace Cloud Functions

```bash
# V root složce projektu
firebase init functions

# Vybrat:
# - TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

## 2. Struktura funkcí

Po inicializaci vytvoř následující strukturu:

```
functions/
├── src/
│   ├── index.ts              # Export všech funkcí
│   └── notifications/
│       ├── sendNotification.ts  # Shared FCM logic
│       ├── onSosBeacon.ts       # SOS trigger
│       ├── onEventComment.ts    # Comment trigger
│       ├── onEventUpdate.ts     # Event update trigger
│       └── onFriendRequest.ts   # Friend request trigger
├── package.json
└── tsconfig.json
```

## 3. Příklad: SOS Beacon Notification

**functions/src/notifications/sendNotification.ts:**
```typescript
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: NotificationPayload) {
  try {
    const message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: "high" as const,
        notification: {
          channelId: "alerts", // Matches Android notification channel
        },
      },
    };
    
    await admin.messaging().send(message);
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
```

**functions/src/notifications/onSosBeacon.ts:**
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "./sendNotification";

const db = admin.firestore();

export const onSosBeaconCreated = functions.firestore
  .document("helpBeacons/{beaconId}")
  .onCreate(async (snap, context) => {
    const beacon = snap.data();
    
    // Get all users with sosAlerts enabled
    const usersSnapshot = await db.collection("users")
      .where("notificationSettings.sosAlerts", "==", true)
      .where("notificationSettings.enabled", "==", true)
      .get();
    
    const notifications = usersSnapshot.docs
      .filter(doc => doc.id !== beacon.userId) // Don't notify the sender
      .filter(doc => doc.data().fcmToken) // Only users with FCM tokens
      .map(doc => sendPushNotification({
        token: doc.data().fcmToken,
        title: "🚨 SOS Volání",
        body: `${beacon.displayName} potřebuje pomoc!`,
        data: { beaconId: context.params.beaconId },
      }));
    
    await Promise.all(notifications);
  });
```

**functions/src/index.ts:**
```typescript
export { onSosBeaconCreated } from "./notifications/onSosBeacon";
// Export other functions as you create them
```

## 4. Deploy

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 5. Testování z Firebase Console

### Ruční odeslání testovací notifikace:

1. Otevři [Firebase Console](https://console.firebase.google.com)
2. Přejdi do **Messaging** (Cloud Messaging)
3. Klikni na **Send your first message** nebo **New notification**
4. Vyplň:
   - **Title**: Test notifikace
   - **Body**: Toto je testovací zpráva
5. V sekci **Target**: 
   - Vyber **Single device**
   - Vlož FCM token z Firestore dokumentu uživatele (`users/{uid}` → `fcmToken`)
6. Klikni **Send test message**

### Získání FCM tokenu:

1. Přejdi do **Firestore Database**
2. Vyber kolekci `users`
3. Najdi svůj dokument (podle UID)
4. Zkopíruj hodnotu pole `fcmToken`

## 6. Monitoring

### Logs

```bash
firebase functions:log
```

### Firebase Console

1. **Functions** → Vyber funkci → **Logs**
2. **Messaging** → **Reports** pro statistiky doručení

## 7. Tipy pro debugging

### Notifikace se nedoručuje?

1. **Zkontroluj fcmToken** - token musí být aktuální
2. **Zkontroluj permissions** - v aplikaci musí být povoleny notifikace
3. **Background/Foreground** - chování se liší:
   - Foreground: aplikace zpracovává notifikaci
   - Background: systém zobrazuje notifikaci

### Web Push nefunguje?

Pro web push musíš nastavit **VAPID key** v Firebase Console:
1. **Project Settings** → **Cloud Messaging**
2. V sekci **Web configuration** → **Generate key pair**
3. Použij tento klíč v aplikaci při inicializaci FCM

## 8. Notification Channels (Android)

Pro Android 8.0+ musíš definovat kanály. Capacitor FCM plugin je vytvoří automaticky, ale pro custom kanály:

```typescript
// V Android MainActivity.java nebo v plugin konfiguraci
// Channel ID musí odpovídat tomu, co posíláš z Cloud Functions
```

---

> **Další kroky**: Po úspěšném testu implementuj zbylé triggery (onEventComment, onEventUpdate, onFriendRequest) podle stejného vzoru.
