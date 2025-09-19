import { useState, useEffect } from "react";
import { useCart } from "../context/cartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { checkoutApi } from "../api/checkoutApi.js";
import "../PagesCss/Cart.css";
import Footer from "../components/Footer";
import Snackbar from "../components/Snackbar.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

const CartPage = () => {
  const {
    cartItems,
    cartSummary,
    loading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    formatPrice,
    clearError
  } = useCart();

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  
  // Estados para pedidos (admin)
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Estado para el modal de confirmación
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null
  });

  // Verificar si es admin
  const isAdmin = user && user.Rol === 'Admin';

  // Limpiar errores del contexto cuando se carga la página del carrito
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Cargar pedidos activos si es admin
  useEffect(() => {
    if (isAdmin) {
      loadActiveOrders();
      
      // Configurar actualización automática cada 30 segundos
      const interval = setInterval(() => {
        loadActiveOrders();
      }, 30000); // 30 segundos
      
      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(interval);
    }
  }, [isAdmin, user]);

  // Función para cargar pedidos activos
  const loadActiveOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await checkoutApi.getActiveOrders();
      console.log('Respuesta de pedidos activos:', response);
      if (response.success && response.orders) {
        setActiveOrders(response.orders);
      } else {
        console.error('Respuesta inesperada:', response);
        setActiveOrders([]);
      }
    } catch (error) {
      console.error('Error cargando pedidos activos:', error);
      setSnackbarMsg("Error al cargar pedidos activos");
      setSnackbarType("error");
      setSnackbarOpen(true);
      setActiveOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Función para marcar pedido como entregado
  const markAsDelivered = async (orderId) => {
    try {
      await checkoutApi.markAsDelivered(orderId);
      setSnackbarMsg("Pedido marcado como entregado");
      setSnackbarType("success");
      setSnackbarOpen(true);
      loadActiveOrders(); // Recargar pedidos
    } catch (error) {
      console.error('Error marcando pedido como entregado:', error);
      setSnackbarMsg("Error al marcar pedido como entregado");
      setSnackbarType("error");
      setSnackbarOpen(true);
    }
  };

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Vista de carga
  if (loading && cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando carrito...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Vista de error
  if (error) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error al cargar el carrito</h4>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              <button 
                className="btn btn-outline-danger"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </button>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Manejar cambio de cantidad
  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    // Validar que cartItemId no sea undefined
    if (!cartItemId) {
      setSnackbarMsg("Error: ID del item no válido");
      setSnackbarType("error");
      setSnackbarOpen(true);
      return;
    }
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateCartItem(cartItemId, newQuantity);
      setSnackbarMsg("Cantidad actualizada exitosamente");
      setSnackbarType("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg(err.message || "Error al actualizar cantidad");
      setSnackbarType("error");
      setSnackbarOpen(true);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  // Manejar eliminación de ítem
  const handleRemoveItem = async (cartItemId) => {
    setConfirmationModal({
      open: true,
      title: "Eliminar Producto",
      message: "¿Estás seguro de que quieres eliminar este producto del carrito?",
      type: "danger",
      onConfirm: async () => {
        try {
          await removeFromCart(cartItemId);
          setSnackbarMsg("Producto eliminado del carrito");
          setSnackbarType("success");
          setSnackbarOpen(true);
        } catch (err) {
          setSnackbarMsg(err.message || "Error al eliminar producto");
          setSnackbarType("error");
          setSnackbarOpen(true);
        }
        setConfirmationModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  // Manejar vaciar carrito
  const handleClearCart = async () => {
    setConfirmationModal({
      open: true,
      title: "Vaciar Carrito",
      message: "¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.",
      type: "danger",
      onConfirm: async () => {
        try {
          await clearCart();
          setSnackbarMsg("Carrito vaciado exitosamente");
          setSnackbarType("success");
          setSnackbarOpen(true);
        } catch (err) {
          setSnackbarMsg(err.message || "Error al vaciar carrito");
          setSnackbarType("error");
          setSnackbarOpen(true);
        }
        setConfirmationModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  // Manejar checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }
    navigate("/checkout");
  };

  // Si es admin, mostrar vista de pedidos
  if (isAdmin) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="cart-title">Pedidos Activos</h2>
              <small className="text-muted">
                <i className="bi bi-clock"></i> Actualización automática cada 30 segundos
              </small>
            </div>
          </div>
          
          {loadingOrders ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Cargando pedidos...</p>
            </div>
          ) : (!activeOrders || activeOrders.length === 0) ? (
            <div className="text-center py-5">
              <h4>No hay pedidos activos</h4>
              <p>Todos los pedidos han sido entregados.</p>
            </div>
          ) : (
            <div className="orders-list">
              {activeOrders && activeOrders.map((order) => (
                <div key={order.OrdenID} className="order-item">
                  <div className="order-header">
                    <h5>Pedido #{order.OrdenID}</h5>
                    <span className="order-date">
                      {new Date(order.FechaOrden).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="order-details">
                    <div className="customer-info">
                      <p><strong>Cliente:</strong> {order.NombreCliente}</p>
                      <p><strong>Email:</strong> {order.EmailCliente}</p>
                      <p><strong>Teléfono:</strong> {order.TelefonoCliente || 'No especificado'}</p>
                      <p><strong>Dirección:</strong> {order.DireccionEnvio}</p>
                      <p><strong>Ciudad:</strong> {order.CiudadEnvio}</p>
                      <p><strong>Código Postal:</strong> {order.CodigoPostalEnvio}</p>
                    </div>
                    
                    <div className="order-items">
                      <h6>Productos:</h6>
                      {order.items && order.items.map((item, index) => (
                        <div key={index} className="order-item-detail">
                          <span>{item.NombreProducto} - Talla: {item.NombreTalla} x{item.Cantidad}</span>
                          <span>{formatPrice(item.Precio * item.Cantidad)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-total">
                      <strong>Total: {formatPrice(order.Total)}</strong>
                    </div>
                  </div>
                  
                  <div className="order-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => markAsDelivered(order.OrdenID)}
                    >
                      Marcar como Entregado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
        
        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          message={snackbarMsg}
          type={snackbarType}
          onClose={() => setSnackbarOpen(false)}
        />
      </div>
    );
  }

  // Si es usuario normal, mostrar carrito
  return (
    <div className="cart-page">
      <div className="container">
        {cartItems.length === 0 ? (
          <div className="text-center py-5">
            <h4>Tu carrito está vacío</h4>
            <p>Agrega algunos productos para comenzar a comprar.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate("/")}
            >
              Continuar Comprando
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div key={item.CarritoArticuloID || `cart-item-${index}`} className="cart-item">
                  <div className="item-image">
                    <img 
                      src={`http://localhost:3001/images/${item.Imagen || 'default.png'}`}
                      alt={item.NombreProducto}
                      onError={(e) => {
                        e.target.src = "http://localhost:3001/images/default.png";
                      }}
                    />
                  </div>
                  
                  <div className="item-details">
                    <h5>{item.NombreProducto}</h5>
                    <p className="item-talla">Talla: {item.NombreTalla}</p>
                    <p className="item-price">Precio unitario: {formatPrice(item.Precio)}</p>
                    <p className="item-stock">Stock disponible: {item.StockDisponible || 5}</p>
                  </div>
                  
                  <div className="item-quantity">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleQuantityChange(item.CarritoArticuloID, item.Cantidad - 1)}
                      disabled={updatingItems.has(item.CarritoArticuloID)}
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.Cantidad}</span>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleQuantityChange(item.CarritoArticuloID, item.Cantidad + 1)}
                      disabled={updatingItems.has(item.CarritoArticuloID) || item.Cantidad >= (item.StockDisponible || 0)}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-total">
                    <strong>{formatPrice(item.Precio * item.Cantidad)}</strong>
                  </div>
                  
                  <div className="item-actions">
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveItem(item.CarritoArticuloID)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <h4>Resumen del Pedido</h4>
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} productos):</span>
                <span>{formatPrice(cartSummary.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Envío:</span>
                <span className="free-shipping">GRATIS</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatPrice(cartSummary.total)}</span>
              </div>
              
              <div className="cart-actions">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleClearCart}
                >
                  Vaciar Carrito
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCheckout}
                >
                  Ir a la Área de Pago
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      <Footer />
      
      {/* Modal de confirmación */}
      <ConfirmationModal
        open={confirmationModal.open}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
      />
      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMsg}
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default CartPage;
