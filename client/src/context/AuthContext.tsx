import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "../api/api";
import type { AuthResponse, User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const saveAuth = (data: AuthResponse["data"]) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const login = async (
    email: string,
    password: string
  ) => {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      {
        email,
        password,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }

    saveAuth(response.data.data);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      {
        name,
        email,
        password,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message);
    }

    saveAuth(response.data.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };
  const updateUser = (updatedUser: User) => {
    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
