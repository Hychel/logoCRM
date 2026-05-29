import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("logo_crm_token");
      if (token) {
        try {
          const profile = await api.get("/api/auth/me");
          setUser(profile);
        } catch (err) {
          console.error("Failed to load user profile, logging out...", err);
          localStorage.removeItem("logo_crm_token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("logo_crm_token", res.access_token);
      const profile = await api.get("/api/auth/me");
      setUser(profile);
      setLoading(false);
      return profile;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("logo_crm_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export default AuthContext;
