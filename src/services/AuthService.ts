import { Context, Effect, Layer, Stream } from "effect";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithCredential } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth, db } from "../config/firebase";
import type { UserProfile } from "../types";
import { doc, setDoc } from "firebase/firestore";

// Define the Error type
export class AuthError {
  readonly _tag = "AuthError";
  readonly message: string;
  readonly originalError: unknown;
  constructor(message: string, originalError: unknown) {
    this.message = message;
    this.originalError = originalError;
  }
}

// Define the Service Interface
export interface AuthService {
  readonly login: (mode?: 'native' | 'web') => Effect.Effect<UserProfile, AuthError>;
  readonly logout: Effect.Effect<void, AuthError>;
  readonly currentUser: Stream.Stream<UserProfile | null>;
}

// Create the Tag
export const AuthService = Context.GenericTag<AuthService>("AuthService");

import { internalizeProfileImage } from "../lib/profileImageService";
import { generateSearchKeys } from "../lib/stringUtils";

// Helper to internalize profile image if needed
const synchronizeProfileImage = async (user: any) => {
  try {
    if (!user.photoURL) return user.photoURL;

    const userRef = doc(db, "users", user.uid);
    // We need to check existing data first to see last update time
    // However, reading it here adds latency to login. 
    // We can do it optimistically or in background.
    // Let's do a quick check.
    // Or better: rely on the URL structure.
    // If URL is already ours (firebasestorage), check metadata (if we had it in doc).

    // Simpler heuristic:
    // 1. If it's NOT a firebase storage URL -> Internalize it (it's new from Google/FB)
    // 2. If it IS a firebase storage URL -> Check last update time from doc (if available)

    // For now, let's implement the "Internalize if external" logic + "Update if old" logic.
    // But we don't have the doc data easily here without a fetch.
    // We'll trust the caller to have basic profile.

    // Actually, we can just fire-and-forget this process so it doesn't block login UI!
    // The user logs in, UI shows old/current photo. Background process updates it.
    // When it finishes, Firestore updates, UI updates automatically via onSnapshot.

    // BUT, for the *very first* time, we might want to wait? No, speed is key.

    // Let's define the background task:
    (async () => {
      try {
        const { getDoc, updateDoc } = await import("firebase/firestore");
        const snapshot = await getDoc(userRef);
        const data = snapshot.data();

        const now = Date.now();
        const lastUpdate = data?.lastPhotoUpdate || 0;
        const isInternal = data?.photoURL?.includes("firebasestorage.googleapis.com");
        const shouldUpdate = !isInternal || (now - lastUpdate > 30 * 24 * 60 * 60 * 1000); // 30 days

        if (shouldUpdate && user.photoURL) {
          console.log("[AuthService] Internalizing profile image...");
          // If it's already internal, we might want to refresh it from the *provider* URL if available?
          // The provider URL is in `user.providerData[0].photoURL`.
          // `user.photoURL` might be the internal one if we already replaced it.

          // We should prefer the PROVIDER's live URL for the fresh fetch.
          const providerPhoto = user.providerData?.[0]?.photoURL || user.photoURL;

          // If provider photo is also internal (unlikely for Google), we skip.
          if (providerPhoto.includes("firebasestorage.googleapis.com") && isInternal) {
            // Nothing to update from
            return;
          }

          const internalUrlEffect = internalizeProfileImage(providerPhoto, user.uid);
          const internalUrl = await Effect.runPromise(internalUrlEffect);

          await updateDoc(userRef, {
            photoURL: internalUrl,
            fallbackPhotoURL: providerPhoto, // Keep Google URL as backup
            lastPhotoUpdate: now
          });
          console.log("[AuthService] Profile image updated to internal storage");
        }
      } catch (err) {
        console.warn("[AuthService] Background image sync failed:", err);
      }
    })();

  } catch (e) {
    console.warn("[AuthService] Error starting image sync:", e);
  }
};

// Implement the Live Layer
export const AuthServiceLive = Layer.succeed(
  AuthService,
  AuthService.of({
    login: (mode?: 'native' | 'web') => Effect.tryPromise({
      try: async () => {
        const provider = new GoogleAuthProvider();
        let user: any = null;

        // Use Native Plugin unless explicitly requested otherwise
        if (Capacitor.isNativePlatform() && mode !== 'web') {
          // Strategy: Try Credential Manager first, then fallback to legacy GoogleSignInClient
          const attemptNativeSignIn = async (useCredentialManager: boolean): Promise<any> => {
            const withTimeout = (promise: Promise<any>, ms: number) =>
              Promise.race([
                promise,
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Přihlášení trvalo příliš dlouho. Zkontrolujte připojení k internetu.")), ms)
                )
              ]);

            const result = await withTimeout(
              FirebaseAuthentication.signInWithGoogle(useCredentialManager ? undefined : { useCredentialManager: false }),
              15000
            );

            const idToken = result?.credential?.idToken;
            if (!idToken) {
              throw new Error("Přihlášení selhalo - nebyl získán přihlašovací token.");
            }

            const credential = GoogleAuthProvider.credential(idToken);
            const cred = await signInWithCredential(auth, credential);
            return cred.user;
          };

          try {
            // 1. Try Credential Manager (modern, default)
            console.log("[Auth] Trying Credential Manager sign-in...");
            user = await attemptNativeSignIn(true);
            console.log("[Auth] Credential Manager sign-in SUCCESS, uid:", user.uid);
          } catch (credentialManagerError: any) {
            console.warn("[Auth] Credential Manager failed:", credentialManagerError?.message || credentialManagerError);

            try {
              // 2. Fallback to legacy GoogleSignInClient (universal compatibility)
              console.log("[Auth] Retrying with legacy GoogleSignIn...");
              user = await attemptNativeSignIn(false);
              console.log("[Auth] Legacy GoogleSignIn SUCCESS, uid:", user.uid);
            } catch (legacyError: any) {
              console.error("[Auth] Legacy GoogleSignIn also failed:", legacyError?.message || legacyError);

              // Build actionable error message
              const isEmpty = JSON.stringify(legacyError) === "{}" || !legacyError?.message;
              if (isEmpty) {
                throw new Error("Přihlášení selhalo. Zkontrolujte, že máte aktuální Google Play Services a zkuste to znovu.");
              }
              throw new Error(`Přihlášení selhalo: ${legacyError?.message || "Neznámá chyba"}`);
            }
          }
        } else {
          // Web platform OR explicit 'web' mode requested
          const result = await signInWithPopup(auth, provider);
          user = result.user;
        }

        // We write the *current* state first to ensure doc exists
        // We Use setDoc with merge: true to avoid overwriting existing fields like 'friends'
        // We also want to ensure 'createdAt' exists for badges
        const docRef = doc(db, "users", user.uid);
        const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef));

        // Basic Profile Update
        const profile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL,
          fallbackPhotoURL: user.providerData?.[0]?.photoURL || user.photoURL, // Store Google URL as backup
        };

        let currentDisplayName = user.displayName;
        let originalName = user.displayName;

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (!(data as any).createdAt) {
            let createdAt = new Date().toISOString();
            if (user.metadata && user.metadata.creationTime) {
              createdAt = new Date(user.metadata.creationTime).toISOString();
            }
            (profile as any).createdAt = createdAt;
          }

          // Do NOT overwrite user-modified display name
          if (data.displayName) {
            currentDisplayName = data.displayName;
          }
          profile.displayName = currentDisplayName;

          // Keep originalName if already set, or set it if new
          if (data.originalName) {
            originalName = data.originalName;
          } else {
            profile.originalName = originalName;
          }
        } else {
          // New user
          let createdAt = new Date().toISOString();
          if (user.metadata && user.metadata.creationTime) {
            createdAt = new Date(user.metadata.creationTime).toISOString();
          }
          (profile as any).createdAt = createdAt;
          profile.displayName = currentDisplayName;
          profile.originalName = originalName;
        }

        // Generate search keys
        profile.searchKeys = generateSearchKeys([currentDisplayName, originalName]);
        profile.searchKey = currentDisplayName ? currentDisplayName.toLowerCase() : ""; // Legacy

        await setDoc(docRef, profile, { merge: true });

        // Trigger background sync of image
        // We pass the fresh 'user' object which contains the provider data
        synchronizeProfileImage(user);

        return profile as UserProfile;
      },
      catch: (error) => {
        console.error("[AuthService] Login failed. Raw error:", error);
        try {
          console.error("[AuthService] Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error as any)));
        } catch (_) { /* ignore serialization errors */ }
        return new AuthError("Failed to login", error);
      }
    }),
    logout: Effect.tryPromise({
      try: () => signOut(auth),
      catch: (error) => new AuthError("Failed to logout", error)
    }),
    currentUser: Stream.async<UserProfile | null>((emit) => {
      // Keep track of unsubscribe function
      let unsubscribeDoc: (() => void) | null = null;

      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        // Clean up previous listener if any
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }

        if (firebaseUser) {
          // OPTIMIZATION: Emit the user IMMEDIATELY based on Auth data
          // This prevents the "flash of login screen" while waiting for Firestore
          const initialProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          };
          emit.single(initialProfile);

          // 1. Ensure basic auth data is synced ONLY for new users.
          // On every page refresh, onAuthStateChanged fires and we must NOT overwrite
          // the Firestore document with just the basic Auth fields – that would pollute
          // the local Firestore cache with an incomplete document (no friends/badges/settings),
          // causing subsequent getDoc calls to return stale data.
          const userRef = doc(db, "users", firebaseUser.uid);
          try {
            const { getDoc: _getDoc } = await import("firebase/firestore");
            const snap = await _getDoc(userRef);
            if (!snap.exists()) {
              // New user – create the document with basic auth data
              await setDoc(userRef, {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                originalName: firebaseUser.displayName,
                searchKeys: generateSearchKeys([firebaseUser.displayName]),
                searchKey: firebaseUser.displayName ? firebaseUser.displayName.toLowerCase() : "",
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL
              }, { merge: true });
            }
            // Existing user – skip setDoc to avoid cache pollution
          } catch (e) {
            console.error("Failed to sync user doc", e);
          }

          // 2. Listen to the document for full profile (friends, settings, etc.)
          const { onSnapshot } = await import("firebase/firestore");
          unsubscribeDoc = onSnapshot(userRef, (snap) => {
            const data = snap.data() as UserProfile | undefined;
            if (data) {
              emit.single(data);
            }
            // If data is missing (shouldn't happen due to setDoc above), 
            // we already emitted the initialProfile, so we remain logged in.
          });
        } else {
          emit.single(null);
        }
      });

      return Effect.sync(() => {
        unsubscribeAuth();
        if (unsubscribeDoc) unsubscribeDoc();
      });
    })
  })
);
