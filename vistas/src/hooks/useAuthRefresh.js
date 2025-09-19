import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Hook personalizado para verificar y refrescar el estado de autenticación
 * Útil para componentes que necesitan asegurar que el estado de auth esté actualizado
 */
export const useAuthRefresh = (dependencies = []) => {
  const { isAuthenticated, user, refreshAuthState } = useAuth();

  useEffect(() => {
    const checkAndRefreshAuth = async () => {
      // Solo verificar si hay un token pero no estamos autenticados
      const token = document.cookie.includes('token=');
      if (token && !isAuthenticated) {
        console.log('🔄 useAuthRefresh: Token encontrado pero no autenticado, verificando...');
        await refreshAuthState();
      }
    };

    checkAndRefreshAuth();
  }, dependencies); // Ejecutar cuando cambien las dependencias

  return { isAuthenticated, user, refreshAuthState };
};
