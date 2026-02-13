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
  readonly login: Effect.Effect<UserProfile, AuthError>;
  readonly logout: Effect.Effect<void, AuthError>;
  readonly currentUser: Stream.Stream<UserProfile | null>;
}

// Create the Tag
export const AuthService = Context.GenericTag<AuthService>("AuthService");

import { internalizeProfileImage } from "../lib/profileImageService";

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
    login: Effect.tryPromise({
      try: async () => {
        const provider = new GoogleAuthProvider();
        let user: any = null;

        // Use Native Plugin for mobile to avoid the "localhost" redirect issue
        if (Capacitor.isNativePlatform()) {
          const result = await FirebaseAuthentication.signInWithGoogle();
          console.log("DEBUG: Native Login Result:", JSON.stringify(result));

          if (!result.user) throw new Error("No user returned from native login");

          // CRITICAL FIX: Bridge native auth to JS SDK
          // This ensures 'auth.currentUser' is set, so Firestore knows who we are.
          const idToken = (result as any).credential?.idToken || (result.user as any).idToken;
          if (idToken) {
            console.log("DEBUG: idToken received, attempting bridge sign-in...");
            const credential = GoogleAuthProvider.credential(idToken);
            try {
              const cred = await signInWithCredential(auth, credential);
              user = cred.user; // Use the bridged user
              console.log("DEBUG: Bridge sign-in successful");
            } catch (bridgeError) {
              console.error("DEBUG: Bridge sign-in FAILED:", bridgeError);
              throw bridgeError;
            }
          } else {
            console.error("CRITICAL: No idToken received. Available fields:", Object.keys(result.user));
            // Without this token, Firestore write below will likely fail with permission-denied
            user = result.user; // Fallback to raw result (might be incomplete)
          }
        } else {
          const result = await signInWithPopup(auth, provider);
          user = result.user;
        }

        // Basic Profile Update
        const profile: Partial<UserProfile> = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };

        // We write the *current* state first to ensure doc exists
        // We Use setDoc with merge: true to avoid overwriting existing fields like 'friends'
        // We also want to ensure 'createdAt' exists for badges
        const docRef = doc(db, "users", user.uid);
        const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef));

        if (!docSnap.exists() || !docSnap.data().createdAt) {
          // For new users or users without createdAt, set it.
          // Try to use metadata from auth user
          let createdAt = new Date().toISOString();
          if (user.metadata && user.metadata.creationTime) {
            createdAt = new Date(user.metadata.creationTime).toISOString();
          }
          (profile as any).createdAt = createdAt;
        }

        await setDoc(docRef, profile, { merge: true });

        // Trigger background sync of image
        // We pass the fresh 'user' object which contains the provider data
        synchronizeProfileImage(user);

        return profile as UserProfile;
      },
      catch: (error) => new AuthError("Failed to login", error)
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

          // 1. Ensure basic auth data is synced (fire-and-forget/background)
          const userRef = doc(db, "users", firebaseUser.uid);
          // We don't await this to avoid blocking the stream if possible, 
          // but we need the doc to exist for onSnapshot. 
          // setDoc is fast usually.
          try {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL
            }, { merge: true });
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
