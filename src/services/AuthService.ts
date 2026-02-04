import { Context, Effect, Layer, Stream } from "effect";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
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

// Implement the Live Layer
export const AuthServiceLive = Layer.succeed(
  AuthService,
  AuthService.of({
    login: Effect.tryPromise({
      try: async () => {
        const provider = new GoogleAuthProvider();

        // Use Native Plugin for mobile to avoid the "localhost" redirect issue
        if (Capacitor.isNativePlatform()) {
          const result = await FirebaseAuthentication.signInWithGoogle();
          if (!result.user) throw new Error("No user returned from native login");

          const profile: UserProfile = {
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoUrl,
          };
          await setDoc(doc(db, "users", result.user.uid), profile, { merge: true });
          return profile;
        }

        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };

        await setDoc(doc(db, "users", user.uid), profile, { merge: true });

        return profile;
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
          // 1. Ensure basic auth data is synced
          const userRef = doc(db, "users", firebaseUser.uid);
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL
          }, { merge: true });

          // 2. Listen to the document
          const { onSnapshot } = await import("firebase/firestore");
          unsubscribeDoc = onSnapshot(userRef, (snap) => {
            const data = snap.data() as UserProfile | undefined;
            if (data) {
              emit.single(data);
            } else {
              // Fallback
              emit.single({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                friends: []
              });
            }
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
