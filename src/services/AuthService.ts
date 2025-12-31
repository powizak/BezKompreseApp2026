import { Context, Effect, Layer, Stream } from "effect";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebase";
import type { UserProfile } from "../types";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          // We don't overwrite friends on login, handled by merge: true
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
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Also sync on auth state restore to ensure fresh data
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          }, { merge: true });

          // Allow fetching friends list which is not in auth object
          const snap = await getDoc(userRef);
          const data = snap.data() as UserProfile | undefined;

          emit.single({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            friends: data?.friends || []
          });
        } else {
          emit.single(null);
        }
      });
      return Effect.void;
    })
  })
);
