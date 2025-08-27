// components/AuthContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.correo) { // Cambié email por correo
          setUser(parsedUser);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error leyendo usuario del localStorage:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    // Asegúrate de que userData incluya id_cliente
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      login, 
      logout,
      loading,
      userId: user?.id_cliente,     // ← Nuevo: ID del cliente
      userEmail: user?.correo,      // ← Nuevo: email
      userName: user?.nombre        // ← Nuevo: nombre
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);