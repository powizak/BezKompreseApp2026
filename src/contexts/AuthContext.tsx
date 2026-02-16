import React, { createContext, useContext, useEffect, useState } from 'react';
import { Effect, Stream } from "effect";
import { AuthService, AuthServiceLive } from "../services/AuthService";
import type { UserProfile } from "../types";
import LoadingState from "../components/LoadingState";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (mode?: 'native' | 'web') => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Get the service instance
  const authService = Effect.runSync(
    Effect.gen(function* (_) {
      return yield* _(AuthService);
    }).pipe(Effect.provide(AuthServiceLive))
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    // Subscribe to user changes
    const stream = authService.currentUser;

    const runStream = async () => {
      console.log("[AuthContext] Subscribing to auth state...");
      await Effect.runPromise(
        Stream.runForEach(stream, (u) => Effect.sync(() => {
          console.log("[AuthContext] Auth state changed:", u ? "User logged in" : "No user");
          setUser(u);
          setLoading(false);
          // Clear timeout if auth resolves quickly
          if (timeoutId) clearTimeout(timeoutId);
        }))
      );
    };

    runStream();

    // Fallback timeout: If Firebase doesn't respond in 3s, stop loading
    // This often happens on first launch or if config is bad
    timeoutId = setTimeout(() => {
      if (loading) { // Check if still loading
        console.warn("[AuthContext] Auth Check Timed Out - Forcing app load");
        setLoading(false);
      }
    }, 3000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const login = async (mode: 'native' | 'web' = 'native') => {
    setError(null);
    try {
      await Effect.runPromise(authService.login(mode));
    } catch (e: any) {
      console.error("Login failed:", e);
      // Extract meaningful message
      let msg = "Přihlášení se nezdařilo.";
      if (e?.message) msg += ` (${e.message})`;
      if (e?.originalError?.message) msg += ` - ${e.originalError.message}`;

      setError(msg);
      // Alert for native visibility if needed, though UI is better
      // alert(msg); 
    }
  };

  const logout = async () => {
    try {
      await Effect.runPromise(authService.logout);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {loading ? (
        <LoadingState message="Načítám aplikaci..." className="min-h-screen" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
