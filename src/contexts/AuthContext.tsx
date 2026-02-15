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
    // Subscribe to user changes
    const stream = authService.currentUser;

    const runStream = async () => {
      await Effect.runPromise(
        Stream.runForEach(stream, (u) => Effect.sync(() => {
          setUser(u);
          setLoading(false);
        }))
      );
    };

    runStream();
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
