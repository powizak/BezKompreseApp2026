# iOS Setup Guide

## Prerequisites

- macOS with Xcode 15+
- Apple Developer Account (paid, $99/year)
- `GoogleService-Info.plist` in `ios/App/App/` (from Firebase Console)

## 1. Apple Developer Account Setup

1. Go to [developer.apple.com](https://developer.apple.com) → Enroll
2. In Xcode → Preferences → Accounts → add your Apple ID
3. In the App target → Signing & Capabilities:
   - **Team**: Select your team
   - **Bundle Identifier**: `cz.bezkomprese.app`
   - Xcode will auto-create a provisioning profile

## 2. Push Notifications

1. In Xcode → App target → Signing & Capabilities → **+ Capability** → **Push Notifications**
   - This is already partially configured via `App.entitlements`
2. In [Firebase Console](https://console.firebase.google.com) → Project Settings → Cloud Messaging → iOS:
   - Upload your **APNs Authentication Key** (.p8 file)
   - You can create this in [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list) → Keys → Create (enable Apple Push Notifications service)
   - Note the **Key ID** and **Team ID**

## 3. Google Sign-In (iOS)

1. In [Firebase Console](https://console.firebase.google.com) → Authentication → Sign-in method → Google:
   - Ensure the iOS app is listed
2. In `ios/App/App/Info.plist`, add the **reversed client ID** as a URL scheme:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
       </array>
     </dict>
   </array>
   ```
   - Find the reversed client ID in your `GoogleService-Info.plist` → `REVERSED_CLIENT_ID`

## 4. Build & Run

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then in Xcode: select a simulator or device → Run (⌘R).

## 5. App Store Submission

1. In Xcode → Product → Archive
2. In Organizer → Distribute App → App Store Connect
3. In [App Store Connect](https://appstoreconnect.apple.com) → create the app listing
4. Submit for review

## Files NOT in git (security)

These files are in `.gitignore` and must be obtained separately:
- `ios/App/App/GoogleService-Info.plist` — Firebase Console
- `.env` — API keys (see `.env.example`)
- `firebase-service-account.json` — Firebase Admin SDK
