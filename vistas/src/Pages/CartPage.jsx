import { useState } from "react";
import { useCart } from "../context/cartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import "../PagesCss/Cart.css";
import Footer from "../components/Footer";

const CartPage = () => {
  const {
    cartItems,
    cartSummary,
    loading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    formatPrice
  } = useCart();

  // Debug: ver qué datos llegan
  console.log('Cart items:', cartItems);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // Manejar cambio de cantidad
  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateCartItem(cartItemId, newQuantity);
    } catch (err) {
      console.error("Error al actualizar cantidad:", err);
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
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto del carrito?")) {
      try {
        await removeFromCart(cartItemId);
      } catch (err) {
        console.error("Error al eliminar producto:", err);
      }
    }
  };

  // Manejar vaciar carrito
  const handleClearCart = async () => {
    if (window.confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
      try {
        await clearCart();
      } catch (err) {
        console.error("Error al vaciar carrito:", err);
      }
    }
  };

  // Manejar checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }
    navigate("/checkout");
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container mt-5">
          <div className="text-center">
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

  return (
    <div className="cart-page">
      <div className="container mt-5">
        <h2 className="cart-title">🛒 Carrito de Compras</h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-5">
            <h4>Tu carrito está vacío</h4>
            <p>¡Agrega algunos productos para comenzar a comprar!</p>
            <button 
              className="btn btn-secondary ir-tienda-btn"
              onClick={() => navigate("/tienda")}
            >
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <>
            {/* Sección de productos en el carrito */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.CarritoArticuloID} className="cart-item">
                  <img
                    src={`http://localhost:3001/images/productos/${item.Imagen.replace('/images/', '')}`}
                    alt={item.NombreProducto}
                    className="cart-item-image"
                    onError={(e) => {
                      console.log('Error loading image:', item.Imagen);
                                      console.log('Full URL attempted:', `http://localhost:3001/images/productos/${item.Imagen.replace('/images/', '')}`);
                e.target.src = "http://localhost:3001/images/default.png";
                    }}
                  />
                  <div className="cart-item-info">
                    <h5>{item.NombreProducto}</h5>
                    <p>
                      Talla: <strong>{item.NombreTalla}</strong>
                    </p>
                    <p>
                      Precio unitario: <strong>{formatPrice(item.Precio)}</strong>
                    </p>
                    <p>
                      Stock disponible: <strong>{item.StockDisponible}</strong>
                    </p>
                    <div className="quantity-selector">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => handleQuantityChange(item.CarritoArticuloID, item.Cantidad - 1)}
                        disabled={updatingItems.has(item.CarritoArticuloID) || item.Cantidad <= 1}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={item.Cantidad}
                        className="quantity-input"
                        readOnly
                      />
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => handleQuantityChange(item.CarritoArticuloID, item.Cantidad + 1)}
                        disabled={updatingItems.has(item.CarritoArticuloID) || item.Cantidad >= item.StockDisponible}
                      >
                        +
                      </button>
                    </div>
                    {updatingItems.has(item.CarritoArticuloID) && (
                      <small className="text-muted">Actualizando...</small>
                    )}
                  </div>
                  <div className="cart-item-actions">
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleRemoveItem(item.CarritoArticuloID)}
                      disabled={updatingItems.has(item.CarritoArticuloID)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="cart-summary">
              <h4>Resumen del Pedido</h4>
              <div className="summary-item">
                <span>Subtotal ({cartSummary.itemCount} productos):</span>
                <strong>{formatPrice(cartSummary.subtotal)}</strong>
              </div>
              <div className="summary-item">
                <span>Envío:</span>
                <strong>{formatPrice(cartSummary.shipping)}</strong>
              </div>
              <hr />
              <div className="summary-total">
                <span>Total:</span>
                <strong>{formatPrice(cartSummary.total)}</strong>
              </div>
              
              <div className="cart-actions mt-3">
                <button 
                  className="btn btn-success btn-lg btn-block bg-black mb-2"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Ir a la Área de Pago"}
                </button>
                
                <button 
                  className="btn btn-outline-danger btn-block"
                  onClick={handleClearCart}
                  disabled={loading}
                >
                  Vaciar Carrito
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
