import { createContext, useState, useContext, useEffect } from "react";
import {
  loginRequest,
  registerRequest,
  verifyTokenRequest,
  logao,
} from "../api/userApi";
import Cookies from "js-cookie";

export const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Ahora errors es un objeto { general?, Correo?, Contrasena?, NombreUsuario?, Direccion?, Ciudad?, Pais?, CodigoPostal? }
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Registrarse
  const signup = async (userData) => {
    try {
      const res = await registerRequest(userData);
      setIsAuthenticated(true);
      setUser({
        UsuarioID: res.data.UsuarioID,
        DireccionID: res.data.DireccionID,
      });
      setErrors({});
    } catch (err) {
      const payload = err.response?.data;
      const mapped = {};

      if (Array.isArray(payload)) {
        payload.forEach((msg) => {
          const l = msg.toLowerCase();
          if (l.includes("correo")) {
            mapped.Correo = msg;
          } else if (l.includes("contraseña") || l.includes("contrasena")) {
            mapped.Contrasena = msg;
          } else if (l.includes("usuario")) {
            mapped.NombreUsuario = msg;
          } else if (l.includes("dirección") || l.includes("direccion")) {
            mapped.Direccion = msg;
          } else if (l.includes("ciudad")) {
            mapped.Ciudad = msg;
          } else if (l.includes("país") || l.includes("pais")) {
            mapped.Pais = msg;
          } else if (
            l.includes("código postal") ||
            l.includes("codigo postal") ||
            l.includes("codigopostal")
          ) {
            mapped.CodigoPostal = msg;
          } else {
            mapped.general = mapped.general
              ? mapped.general + " / " + msg
              : msg;
          }
        });
      } else if (
        payload &&
        typeof payload === "object" &&
        !payload.message
      ) {
        // Si vienen como { field: ["err1","err2"], ... }
        Object.entries(payload).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val.join(" / ") : val;
        });
      } else if (typeof payload === "string") {
        mapped.general = payload;
      } else if (payload?.message) {
        mapped.general = payload.message;
      } else {
        mapped.general = "Error inesperado al registrar.";
      }

      setErrors(mapped);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Iniciar sesión (mapeo original)
  const signin = async (userData) => {
    try {
      const res = await loginRequest(userData);
      setIsAuthenticated(true);
      setUser(res.data);
      setErrors({});
    } catch (err) {
      const payload = err.response?.data;
      const mapped = {};

      if (Array.isArray(payload)) {
        payload.forEach((msg) => {
          const l = msg.toLowerCase();
          if (l.includes("correo")) mapped.Correo = msg;
          else if (l.includes("contraseña") || l.includes("contrasena"))
            mapped.Contrasena = msg;
          else
            mapped.general = mapped.general
              ? mapped.general + " / " + msg
              : msg;
        });
      } else if (typeof payload === "string") {
        mapped.general = payload;
      } else if (payload?.message) {
        mapped.general = payload.message;
      } else {
        mapped.general = "Error inesperado al iniciar sesión.";
      }

      setErrors(mapped);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await logao();
      Cookies.remove("token");
      setIsAuthenticated(false);
      setUser(null);
      setErrors({});
    } catch (err) {
      console.error(err);
    }
  };

  // Limpia errores tras 5s
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const t = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(t);
    }
  }, [errors]);

  // Verifica token al montar
  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return setLoading(false);
      }
      try {
        const res = await verifyTokenRequest(token);
        if (res.data?.UsuarioID) {
          setIsAuthenticated(true);
          setUser(res.data);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        logout,
        user,
        isAuthenticated,
        errors,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
