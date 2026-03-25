import * as React from "react";

import { sleep } from "./utils";

// interface User {
//   id: string;
//   username: string;
//   email: string;
// }

export interface AuthContext {
  isAuthenticated: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  user: string | null;
}

export const defaultAuthContext: AuthContext = {
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  user: null,
};

const AuthContext = React.createContext<AuthContext>(defaultAuthContext);

const key = "tanstack.auth.user";

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
}

function setStoredUser(user: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (user) {
    localStorage.setItem(key, user);
  } else {
    localStorage.removeItem(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("auth-token");
    if (token) {
      fetch("/api/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((userData) => {
          if (userData.valid) {
            setUser(userData.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("auth-token");
            setUser(null);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem("auth-token");
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    await sleep(250);

    setStoredUser(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = React.useCallback(async (username: string) => {
    await sleep(500);

    setStoredUser(username);
    setUser(username);
    setIsAuthenticated(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
