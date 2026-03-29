import * as React from "react";

import { getLogout, getValidateToken } from "#/api/auth";

const AUTH_USER_KEY = "tanstack.auth.user";
const AUTH_TOKEN_KEY = "auth-token";

export type LoginSessionPayload = {
  token: string;
  username: string;
};

export interface AuthContext {
  isAuthenticated: boolean;
  login: (session: LoginSessionPayload) => Promise<void>;
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

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_USER_KEY);
}

function setStoredUser(user: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, user);
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
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

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      getValidateToken()
        .then((userData) => {
          if (userData.valid) {
            setUser(userData.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem(AUTH_TOKEN_KEY);
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
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null;
    if (token) {
      try {
        await getLogout();
      } catch {
        // 接口失败仍清理本地态，避免前端卡在已登录状态
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setStoredUser(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = React.useCallback(async (session: LoginSessionPayload) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    }
    setStoredUser(session.username);
    setUser(session.username);
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
