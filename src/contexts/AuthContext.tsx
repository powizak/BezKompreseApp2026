import React, { createContext, useContext, useEffect, useState } from 'react';
import { Effect, Stream } from "effect";
import { AuthService, AuthServiceLive } from "../services/AuthService";
import type { UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = async () => {
    try {
      await Effect.runPromise(authService.login);
    } catch (e) {
      console.error(e);
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
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
