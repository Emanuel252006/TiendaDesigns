import { createContext, useState, useContext, useEffect } from "react";
import {
  loginRequest,
  registerRequest,
  verifyTokenRequest,
  getProfileRequest,
  updateProfileRequest,
  changePasswordRequest,
  globalHeartbeatRequest,
} from "../api/userApi";
import Cookies from "js-cookie";
import axiosInstance from "../api/axios";

export const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

// Dentro de AuthProvider, en la función signup:
const signup = async (userData) => {
  try {
    const res = await registerRequest(userData);
    setErrors({});
    return { success: true };
  } catch (err) {
    const payload = err.response?.data;
    const mapped = {};

    // Manejar errores de validación del registro
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      // Los errores ya vienen en formato de objeto con las claves de los campos
      Object.entries(payload).forEach(([key, val]) => {
        mapped[key] = Array.isArray(val) ? val.join(" / ") : val;
      });
    } else if (Array.isArray(payload)) {
      // Fallback para arrays (por si acaso)
      payload.forEach((msg) => {
        const l = msg.toLowerCase();
        if (l.includes("confirmación") || l.includes("confirmacion") || l.includes("coinciden") || l.includes("no coinciden"))
          mapped.confirmPassword = msg;
        else if (l.includes("correo") || l.includes("email"))
          mapped.Correo = msg;
        else if (l.includes("contraseña") || l.includes("contrasena"))
          mapped.Contrasena = msg;
        else if (l.includes("usuario") || l.includes("nombre"))
          mapped.NombreUsuario = msg;
        else if (l.includes("dirección") || l.includes("direccion"))
          mapped.Direccion = msg;
        else if (l.includes("ciudad"))
          mapped.Ciudad = msg;
        else if (l.includes("país") || l.includes("pais"))
          mapped.Pais = msg;
        else if (
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
    } else if (typeof payload === "string") {
      mapped.general = payload;
    } else if (payload?.message) {
      mapped.general = payload.message;
    } else {
      mapped.general = "Error inesperado al registrar.";
    }

    setErrors(mapped);
    return { success: false };
  }
};

  // --------------------
  // signin: inicia sesión y almacena token/usuario
  // --------------------
  const signin = async (userData) => {
    try {
      const res = await loginRequest(userData);
      setIsAuthenticated(true);
      setUser(res.data);
      setErrors({});
      return { success: true };
    } catch (err) {
      const payload = err.response?.data;
      const mapped = {};

      // Log para depuración
      console.log('Respuesta de error en login:', payload);

      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        // Si es un objeto tipo { Correo: 'msg', Contrasena: 'msg' }
        Object.entries(payload).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val.join(" / ") : val;
        });
      } else if (Array.isArray(payload)) {
        payload.forEach((msg) => {
          const l = msg.toLowerCase();
          if (l.includes("correo")) mapped.Correo = msg;
          else if (l.includes("contraseña") || l.includes("contrasena")) mapped.Contrasena = msg;
          else mapped.general = mapped.general ? mapped.general + " / " + msg : msg;
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
      return { success: false };
    }
  };

  // --------------------
  // logout
  // --------------------
  const logout = async () => {
    console.log('🚨 PRUEBA - Función logout ejecutándose');
    try {
      // Llamar a la API de logout correcta que tiene requiredAuth
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Error en logout API:', err);
      // Continuar con el logout local incluso si falla la API
    } finally {
      // Siempre limpiar el estado local
      Cookies.remove("token");
      setIsAuthenticated(false);
      setUser(null);
      setErrors({});
      console.log('✅ Estado local limpiado');
    }
  };

  // --------------------
  // loadProfile: carga el perfil completo del usuario
  // --------------------
  const loadProfile = async () => {
    try {
      const res = await getProfileRequest();
      setUser(res.data);
      return { success: true };
    } catch (err) {
      // Solo loggear errores que no sean de autenticación
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        console.error("Error al cargar el perfil:", err.message);
      }
      return { success: false };
    }
  };

  // --------------------
  // refreshAuthState: fuerza la verificación del estado de autenticación
  // --------------------
  const refreshAuthState = async () => {
    console.log('🔄 Refrescando estado de autenticación...');
    const token = Cookies.get("token");
    
    if (!token) {
      console.log('❌ No hay token, limpiando estado...');
      setIsAuthenticated(false);
      setUser(null);
      setErrors({});
      return { success: false, message: 'No hay token de autenticación' };
    }

    try {
      const res = await verifyTokenRequest();
      if (res.data?.valid && res.data?.UsuarioID) {
        console.log('✅ Token válido, actualizando estado:', res.data);
        setIsAuthenticated(true);
        setUser(res.data);
        
        // También cargar el perfil completo para tener todos los datos
        try {
          await loadProfile();
        } catch (profileErr) {
          console.log('⚠️ Error al cargar perfil completo, pero el token es válido');
        }
        
        return { success: true, message: 'Estado de autenticación actualizado' };
      } else {
        console.log('❌ Token inválido, limpiando estado...');
        Cookies.remove("token");
        setIsAuthenticated(false);
        setUser(null);
        setErrors({});
        return { success: false, message: 'Token inválido' };
      }
    } catch (error) {
      console.log('❌ Error al verificar token:', error.message);
      Cookies.remove("token");
      setIsAuthenticated(false);
      setUser(null);
      setErrors({});
      return { success: false, message: 'Error al verificar token' };
    }
  };

  // --------------------
  // updateProfile: actualiza el perfil del usuario
  // --------------------
  const updateProfile = async (profileData) => {
    try {
      const res = await updateProfileRequest(profileData);
      setErrors({});
      // Actualizar el usuario en el contexto con los nuevos datos
      // Mapear las claves del backend a las claves del frontend
      const mappedUpdates = {};
      if (profileData.NombreUsuario !== undefined) mappedUpdates.NombreUsuario = profileData.NombreUsuario;
      if (profileData.Correo !== undefined) mappedUpdates.Correo = profileData.Correo;
      if (profileData.Telefono !== undefined) mappedUpdates.Telefono = profileData.Telefono;
      if (profileData.Direccion !== undefined) mappedUpdates.Direccion = profileData.Direccion;
      if (profileData.Ciudad !== undefined) mappedUpdates.Ciudad = profileData.Ciudad;
      if (profileData.Pais !== undefined) mappedUpdates.Pais = profileData.Pais;
      if (profileData.CodigoPostal !== undefined) mappedUpdates.CodigoPostal = profileData.CodigoPostal;
      
      // Si la respuesta es exitosa, actualizar el usuario con los nuevos datos
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        // Recargar el perfil completo para asegurar que tenemos todos los datos actualizados
        try {
          await loadProfile();
        } catch (loadError) {
          // Si falla la recarga, no es crítico, solo loggear
          console.log('⚠️ No se pudo recargar el perfil, pero la actualización fue exitosa');
        }
      }
      return { success: true };
    } catch (err) {
      const payload = err.response?.data;
      const mapped = {};

      // Manejar errores de validación del perfil
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        // Los errores ya vienen en formato de objeto con las claves de los campos
        Object.entries(payload).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val.join(" / ") : val;
        });
      } else if (Array.isArray(payload)) {
        // Fallback para arrays (por si acaso)
        payload.forEach((msg) => {
          const l = msg.toLowerCase();
          if (l.includes("correo") || l.includes("email"))
            mapped.Correo = msg;
          else if (l.includes("usuario") || l.includes("nombre"))
            mapped.NombreUsuario = msg;
          else if (l.includes("teléfono") || l.includes("telefono"))
            mapped.Telefono = msg;
          else if (l.includes("dirección") || l.includes("direccion"))
            mapped.Direccion = msg;
          else if (l.includes("ciudad"))
            mapped.Ciudad = msg;
          else if (l.includes("país") || l.includes("pais"))
            mapped.Pais = msg;
          else if (
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
      } else if (typeof payload === "string") {
        mapped.general = payload;
      } else if (payload?.message) {
        mapped.general = payload.message;
      } else {
        // Solo mostrar error genérico si realmente hay un error de servidor
        if (err.response?.status >= 400) {
          mapped.general = "Error inesperado al actualizar el perfil.";
        }
      }

      // Solo establecer errores si realmente hay errores
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
        return { success: false };
      }
      
      // Si no hay errores específicos, la actualización fue exitosa
      return { success: true };
    }
  };

  // --------------------
  // limpiar errores tras 5s
  // --------------------
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const t = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(t);
    }
  }, [errors]);

  // --------------------
  // verifica token al montar
  // --------------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await verifyTokenRequest();
        if (res.data?.valid && res.data?.UsuarioID) {
          setIsAuthenticated(true);
          setUser(res.data);
          console.log('✅ Token válido, usuario autenticado:', res.data);
        } else {
          console.log('❌ Token inválido o expirado');
          setIsAuthenticated(false);
          setUser(null);
          Cookies.remove("token");
        }
      } catch (error) {
        console.log('❌ Error al verificar token:', error.message);
        setIsAuthenticated(false);
        setUser(null);
        Cookies.remove("token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --------------------
  // Escuchar cambios en el token de las cookies (menos agresivo)
  // --------------------
  useEffect(() => {
    const checkToken = () => {
      const token = Cookies.get("token");
      if (!token && isAuthenticated) {
        console.log('🔍 Token eliminado, cerrando sesión...');
        setIsAuthenticated(false);
        setUser(null);
        setErrors({});
      } else if (token && isAuthenticated && user) {
        // Solo verificar actualización de datos ocasionalmente para evitar spam
        const shouldCheck = Math.random() < 0.1; // 10% de probabilidad
        if (shouldCheck) {
          console.log('🔍 Verificando actualización de datos del usuario...');
          loadProfile().catch(err => {
            // Solo loggear errores críticos, no errores de red normales
            if (err.response?.status !== 401 && err.response?.status !== 403) {
              console.log('❌ Error al verificar actualización de datos:', err.message);
            }
          });
        }
      }
    };

    // Verificar cada 2 minutos si el token sigue existiendo y actualizar datos
    const interval = setInterval(checkToken, 120000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // --------------------
  // Escuchar eventos de navegación del navegador (popstate)
  // --------------------
  useEffect(() => {
    const handlePopState = async () => {
      console.log('🔄 Navegación hacia atrás detectada, verificando estado de autenticación...');
      
      const token = Cookies.get("token");
      if (!token) {
        console.log('❌ No hay token, limpiando estado...');
        setIsAuthenticated(false);
        setUser(null);
        setErrors({});
        return;
      }

      // Si hay token pero no estamos autenticados, verificar el token
      if (token && !isAuthenticated) {
        console.log('🔍 Token encontrado pero no autenticado, verificando...');
        try {
          const res = await verifyTokenRequest();
          if (res.data?.valid && res.data?.UsuarioID) {
            console.log('✅ Token válido, restaurando sesión:', res.data);
            setIsAuthenticated(true);
            setUser(res.data);
          } else {
            console.log('❌ Token inválido, limpiando...');
            Cookies.remove("token");
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.log('❌ Error al verificar token en popstate:', error.message);
          Cookies.remove("token");
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      
      // Si estamos autenticados, verificar que los datos del usuario estén actualizados
      if (token && isAuthenticated && user) {
        console.log('🔍 Verificando actualización de datos del usuario tras navegación...');
        try {
          await loadProfile();
          // Disparar evento personalizado para notificar a otros contextos
          window.dispatchEvent(new CustomEvent('authStateRefreshed', { 
            detail: { user: user, isAuthenticated: true } 
          }));
        } catch (err) {
          // Solo loggear errores críticos
          if (err.response?.status !== 401 && err.response?.status !== 403) {
            console.log('❌ Error al actualizar datos del usuario:', err.message);
          }
        }
      }
    };

    // Agregar listener para eventos de navegación hacia atrás
    window.addEventListener('popstate', handlePopState);
    
    // También verificar cuando la página se vuelve visible (por si el usuario regresa de otra pestaña)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página visible, verificando estado de autenticación...');
        handlePopState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user]);



    return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        logout,
        loadProfile,
        updateProfile,
        refreshAuthState,
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