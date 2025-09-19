import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/cartContext.jsx';

/**
 * Hook personalizado para sincronizar el estado de autenticación y carrito
 * Útil para componentes que necesitan asegurar que ambos estados estén actualizados
 */
export const useAuthAndCartSync = (dependencies = []) => {
  const { isAuthenticated, user, refreshAuthState } = useAuth();
  const { refreshCart } = useCart();

  useEffect(() => {
    const syncAuthAndCart = async () => {
      // Solo verificar si hay un token pero no estamos autenticados
      const token = document.cookie.includes('token=');
      if (token && !isAuthenticated) {
        console.log('🔄 useAuthAndCartSync: Token encontrado pero no autenticado, sincronizando...');
        
        // Primero refrescar la autenticación
        await refreshAuthState();
        
        // Luego refrescar el carrito con un pequeño delay
        setTimeout(() => {
          refreshCart();
        }, 200);
      }
    };

    syncAuthAndCart();
  }, dependencies); // Ejecutar cuando cambien las dependencias

  return { isAuthenticated, user, refreshAuthState, refreshCart };
};
