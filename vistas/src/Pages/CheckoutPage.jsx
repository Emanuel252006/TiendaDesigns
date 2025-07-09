import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { checkoutApi } from '../api/checkoutApi.js';
import { getCheckoutDataRequest } from '../api/userApi.js';
import '../PagesCss/CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, formatPrice, getTotalPrice } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'Colombia',
    metodoPago: 'efectivo'
  });

  // Cargar datos básicos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Cargar solo nombre y email del usuario
  const loadUserData = async () => {
    try {
      const response = await getCheckoutDataRequest();
      if (response.data.success) {
        const userInfo = response.data.data;
        console.log('Datos básicos del usuario:', userInfo);
        // Pre-llenar todos los campos posibles
        setFormData(prev => ({
          ...prev,
          nombre: userInfo.nombre || user.NombreUsuario || '',
          email: userInfo.email || user.Correo || '',
          direccion: userInfo.direccion || user.Direccion || '',
          ciudad: userInfo.ciudad || user.Ciudad || '',
          codigoPostal: userInfo.codigoPostal || user.CodigoPostal || '',
          pais: userInfo.pais || user.Pais || 'Colombia',
          telefono: userInfo.telefono || user.Telefono || ''
        }));
      }
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
      // Si falla, usar datos básicos del contexto
      if (user) {
        setFormData(prev => ({
          ...prev,
          nombre: user.NombreUsuario || '',
          email: user.Correo || '',
          direccion: user.Direccion || '',
          ciudad: user.Ciudad || '',
          codigoPostal: user.CodigoPostal || '',
          pais: user.Pais || 'Colombia',
          telefono: user.Telefono || ''
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const checkoutData = {
        ...formData,
        items: cartItems.map(item => ({
          ProductoID: item.ProductoID,
          TallaID: item.TallaID,
          Cantidad: item.Cantidad,
          Precio: item.Precio
        }))
      };

      console.log('Datos del carrito:', cartItems);
      console.log('Datos a enviar:', checkoutData);

      const result = await checkoutApi.processCheckout(checkoutData);
      
      // Limpiar carrito
      clearCart();
      
      // Redirigir a página de éxito con la información de la orden
      navigate('/checkout-success', { 
        state: { 
          orderId: result.orderId,
          whatsappLink: result.whatsappLink,
          pdfUrl: result.pdfUrl
        } 
      });
      
    } catch (err) {
      setError(err.error || 'Error al procesar el checkout');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Carrito Vacío</h2>
        <p>No hay productos en tu carrito para proceder al checkout.</p>
        <button onClick={() => navigate('/store')} className="btn-primary">
          Ir a la Tienda
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <h1>Finalizar Compra</h1>
        
        <div className="checkout-grid">
          {/* Formulario de datos */}
          <div className="checkout-form-section">
            <h2>Información de Envío</h2>
            
            {user && (
              <div className="user-info-notice">
                <p>✅ Tu nombre y email ya están pre-llenados. Completa los datos de envío.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: 3001234567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección *</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                  placeholder="Calle, número, apartamento"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ciudad">Ciudad *</label>
                  <input
                    type="text"
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Bogotá"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="codigoPostal">Código Postal *</label>
                  <input
                    type="text"
                    id="codigoPostal"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: 110111"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pais">País *</label>
                <input
                  type="text"
                  id="pais"
                  name="pais"
                  value={formData.pais}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="metodoPago">Método de Pago</label>
                <select
                  id="metodoPago"
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleInputChange}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="btn-checkout"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>

          {/* Resumen del carrito */}
          <div className="checkout-summary">
            <h2>Resumen del Pedido</h2>
            
            <div className="cart-items-summary">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item-summary">
                  <div className="item-image">
                    <img 
                      src={`http://localhost:3001/images/productos/${item.Imagen.replace('/images/', '')}`} 
                      alt={item.NombreProducto}
                    />
                  </div>
                  <div className="item-details">
                    <h4>{item.NombreProducto}</h4>
                    <p>Talla: {item.NombreTalla}</p>
                    <p>Cantidad: {item.Cantidad}</p>
                    <p className="item-price">{formatPrice(item.Precio * item.Cantidad)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="total-row">
                <span>Envío:</span>
                <span>{formatPrice(20000)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>{formatPrice(getTotalPrice() + 20000)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 