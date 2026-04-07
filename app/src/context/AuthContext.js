import React, {createContext, useContext, useEffect, useMemo, useState} from "react";
import {loginRequest, registerRequest} from "../api/auth";
import {getErrorMessage, setAuthToken} from "../api/client";
import {clearAuth, getStoredAuth, saveAuth} from "../api/storage";

const AuthContext = createContext(null);

function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const stored = await getStoredAuth();
        if (stored.token && stored.user) {
          setToken(stored.token);
          setUser(stored.user);
          setAuthToken(stored.token);
        }
      } finally {
        setIsBootstrapping(false);
      }
    }
    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginRequest({email, password});
      setToken(data.token);
      setUser(data.user);
      setAuthToken(data.token);
      await saveAuth(data.token, data.user);
      return {ok: true};
    } catch (error) {
      return {ok: false, message: getErrorMessage(error)};
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await registerRequest({name, email, password});
      setToken(data.token);
      setUser(data.user);
      setAuthToken(data.token);
      await saveAuth(data.token, data.user);
      return {ok: true};
    } catch (error) {
      return {ok: false, message: getErrorMessage(error)};
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await clearAuth();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isBootstrapping,
      isLoggedIn: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export {AuthProvider, useAuth};
