import { createContext, useContext, useState, useEffect } from "react";
import { cartApi } from "../api/cartApi.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    total: 0,
    itemCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  // Cargar carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🛒 CartContext: Usuario autenticado, cargando carrito para:', user.NombreUsuario);
      loadCart();
    } else {
      console.log('🛒 CartContext: Usuario no autenticado, limpiando carrito');
      // Limpiar carrito si no está autenticado
      setCartItems([]);
      setCartSummary({
        subtotal: 0,
        shipping: 0,
        total: 0,
        itemCount: 0
      });
    }
  }, [isAuthenticated, user]);

  // Escuchar eventos de navegación para recargar el carrito
  useEffect(() => {
    const handlePopState = () => {
      console.log('🛒 CartContext: Navegación hacia atrás detectada, verificando carrito...');
      if (isAuthenticated && user) {
        // Pequeño delay para asegurar que el AuthContext se haya actualizado
        setTimeout(() => {
          console.log('🛒 CartContext: Recargando carrito tras navegación...');
          loadCart();
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user) {
        console.log('🛒 CartContext: Página visible, verificando carrito...');
        setTimeout(() => {
          loadCart();
        }, 100);
      }
    };

    const handleAuthStateRefreshed = (event) => {
      console.log('🛒 CartContext: Estado de autenticación refrescado, recargando carrito...');
      const { user: refreshedUser, isAuthenticated: refreshedAuth } = event.detail;
      if (refreshedAuth && refreshedUser) {
        setTimeout(() => {
          loadCart();
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('authStateRefreshed', handleAuthStateRefreshed);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('authStateRefreshed', handleAuthStateRefreshed);
    };
  }, [isAuthenticated, user]);

  // Cargar carrito desde el servidor
  const loadCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      
      if (response.success) {
        setCartItems(response.data.items);
        setCartSummary(response.data.summary);
      }
    } catch (err) {
      console.error("Error al cargar carrito:", err);
      setError("Error al cargar el carrito");
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito
  const addToCart = async (productData) => {
    if (!isAuthenticated) {
      throw new Error("¡Inicia sesión para agregar productos a tu carrito!");
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.addToCart(productData);
      
      if (response.cart) {
        setCartItems(response.cart.items);
        setCartSummary(response.cart.summary);
      } else if (response.success) {
        // Recargar carrito para obtener datos actualizados (fallback)
        await loadCart();
      }
      if (response.success || response.cart) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error al agregar al carrito:", err);
      
      // Manejar errores específicos del backend
      let errorMessage = "Error al agregar al carrito";
      
      if (err.response) {
        // Error de respuesta del servidor (400, 500, etc.)
        const { status, data } = err.response;
        
        if (status === 400) {
          // Errores de validación o stock
          if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          }
        } else if (status === 401) {
          errorMessage = "Debes iniciar sesión para agregar productos al carrito";
        } else if (status === 500) {
          errorMessage = "Error interno del servidor. Inténtalo de nuevo más tarde.";
        }
      } else if (err.message) {
        // Error de red u otro tipo
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un ítem
  const updateCartItem = async (cartItemId, cantidad) => {
    console.log('🔍 Debug - updateCartItem en contexto:', { cartItemId, cantidad });
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Debug - Llamando cartApi.updateCartItem...');
      const response = await cartApi.updateCartItem(cartItemId, cantidad);
      console.log('🔍 Debug - Respuesta de cartApi:', response);
      
      if (response.success) {
        console.log('🔍 Debug - Recargando carrito...');
        await loadCart();
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error al actualizar carrito:", err);
      setError(err.message || "Error al actualizar cantidad");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar ítem del carrito
  const removeFromCart = async (cartItemId) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removeFromCart(cartItemId);
      
      if (response.success) {
        await loadCart();
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error al eliminar del carrito:", err);
      setError(err.message || "Error al eliminar producto");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito completo
  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.clearCart();
      
      if (response.success) {
        setCartItems([]);
        setCartSummary({
          subtotal: 0,
          shipping: 0,
          total: 0,
          itemCount: 0
        });
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Error al vaciar carrito:", err);
      setError(err.message || "Error al vaciar carrito");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar stock de un producto
  const checkStock = async (productoId, tallaId) => {
    try {
      const response = await cartApi.checkStock(productoId, tallaId);
      return response.data?.stock || 0;
    } catch (err) {
      console.error("Error al verificar stock:", err);
      return 0;
    }
  };

  // Limpiar errores
  const clearError = () => {
    setError(null);
  };

  // Refrescar carrito manualmente
  const refreshCart = async () => {
    console.log('🛒 CartContext: Refrescando carrito manualmente...');
    if (isAuthenticated && user) {
      await loadCart();
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Calcular total del carrito
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.Precio * item.Cantidad), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSummary,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        checkStock,
        loadCart,
        refreshCart,
        clearError,
        formatPrice,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 