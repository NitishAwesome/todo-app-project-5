import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, LoginRequest, RegisterRequest, AuthContextType } from "../types/auth";
import { authApi, getStoredToken, setStoredToken, removeStoredToken } from "../authAPI";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount or validate stored token
  const restoreSession = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getMe(existingToken);
      setUser(currentUser);
      setToken(existingToken);
    } catch {
      // Token is expired, invalid, or database rejected it -> clear session
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Log in user and persist token
  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  // Register user and immediately authenticate
  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
    // After successful registration, log in directly to issue token
    const loginResponse = await authApi.login({
      email: data.email,
      password: data.password,
    });
    setStoredToken(loginResponse.access_token);
    setToken(loginResponse.access_token);
    setUser(loginResponse.user);
  };

  // Log out user and purge token from storage
  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
