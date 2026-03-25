import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthAndCartSync } from '../hooks/useAuthAndCartSync.js';
import { checkoutApi } from '../api/checkoutApi.js';
import { getCheckoutDataRequest } from '../api/userApi.js';
import payuApi from '../api/payuApi.js';
import '../PagesCss/CheckoutPage.css';
import Swal from 'sweetalert2';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, formatPrice, getTotalPrice, refreshCart } = useCart();
  const { user } = useAuth();
  
  // Usar el hook para sincronizar autenticación y carrito
  useAuthAndCartSync([user]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'Colombia'
  });

  const [creditCardData, setCreditCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    type: 'VISA'
  });

  // Cargar datos del usuario cuando se monta el componente o cuando cambia el usuario
  useEffect(() => {
    console.log('useEffect ejecutado - Usuario:', user);
    if (user) {
      console.log('Usuario disponible, cargando datos...');
      loadUserData();
    } else {
      console.log('Usuario no disponible aún');
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('Cargando datos del usuario...');
      const userData = await getCheckoutDataRequest();
      console.log('Datos del usuario obtenidos:', userData);
      
      if (userData) {
        setFormData({
          nombre: userData.NombreUsuario || '',
          email: userData.Correo || '',
          telefono: userData.Telefono || '',
          direccion: userData.Direccion || '',
          ciudad: userData.Ciudad || '',
          codigoPostal: userData.CodigoPostal || '',
          pais: userData.Pais || 'Colombia'
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreditCardChange = (e) => {
    const { name, value } = e.target;
    setCreditCardData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayUPayment = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniciando pago con PayU...');

      // Validar datos de la tarjeta
      if (!creditCardData.number || !creditCardData.name || !creditCardData.expiry || !creditCardData.cvv) {
        throw new Error('Por favor completa todos los datos de la tarjeta');
      }

      const paymentData = {
        creditCard: {
          number: creditCardData.number,
          name: creditCardData.name,
          expirationDate: creditCardData.expiry, // Ahora en formato YYYY/MM
          cvv: creditCardData.cvv, // Se mapeará a securityCode en backend
          type: creditCardData.type
        },
        billingAddress: {
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          telefono: formData.telefono
        }
      };

      const response = await payuApi.createPayment(paymentData);

      if (response.success) {
        console.log('✅ Pago PayU exitoso:', response);

        // Refrescar el carrito para que se vea vacío visualmente
        await refreshCart();

        await Swal.fire({
          title: '¡Pago Exitoso!',
          text: `Tu orden #${response.orderId} ha sido procesada. Total: ${formatPrice(response.amount)}`,
          icon: 'success',
          confirmButtonText: 'Ver Mis Pedidos'
        });

        navigate('/mis-pedidos');
      } else {
        throw new Error(response.message || 'Error procesando el pago con PayU');
      }
    } catch (error) {
      console.error('❌ Error en pago PayU:', error);
      setError(error.message || 'Error procesando el pago');

      await Swal.fire({
        title: 'Error en el Pago',
        text: error.message || 'Hubo un problema procesando tu pago con PayU',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Guardar datos del formulario en localStorage para procesar después del pago
      const checkoutData = {
        ...formData,
        items: cartItems.map(item => ({
          ProductoID: item.ProductoID,
          TallaID: item.TallaID,
          Cantidad: item.Cantidad,
          Precio: item.Precio
        }))
      };
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

      // Redirigir a PayU (método por defecto)
      await handlePayUPayment();

    } catch (error) {
      console.error('❌ Error en checkout:', error);
      setError(error.message || 'Error procesando el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    try {
      setLoading(true);
      console.log('🎭 Iniciando simulación de pago...');

      const response = await checkoutApi.simulateCheckoutAndPayment();
      
      if (response.success) {
        console.log('✅ Simulación exitosa:', response);

        // Refrescar el carrito para que se vea vacío visualmente
        await refreshCart();

        await Swal.fire({
          title: '¡Simulación Exitosa!',
          text: `Tu orden #${response.orderId} ha sido simulada. Total: ${formatPrice(response.amount)}`,
          icon: 'success',
          confirmButtonText: 'Ver Dashboard'
        });

        // Redirigir al dashboard de ventas si es admin, sino a mis pedidos
        if (user?.Rol === 'Admin') {
          navigate('/dashboard-ventas');
        } else {
          navigate('/mis-pedidos');
        }
      } else {
        throw new Error(response.message || 'Error en la simulación');
      }
    } catch (error) {
      console.error('❌ Error en simulación:', error);
      setError(error.message || 'Error en la simulación');

      await Swal.fire({
        title: 'Error en Simulación',
        text: error.message || 'Hubo un problema con la simulación',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Si no hay items en el carrito, redirigir al carrito
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega algunos productos antes de proceder al checkout.</p>
          <button onClick={() => navigate('/carrito')} className="btn-primary">
            Ver Carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Finalizar Compra</h1>
        <p>Completa tu información para procesar el pedido</p>
      </div>

      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Información Personal */}
          <div className="form-section">
            <h3>Información Personal</h3>
            
            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono *</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dirección de Envío */}
          <div className="form-section">
            <h3>Dirección de Envío</h3>
            
            <div className="form-group">
              <label htmlFor="direccion">Dirección *</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                required
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="codigoPostal">Código Postal</label>
                <input
                  type="text"
                  id="codigoPostal"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pais">País</label>
              <input
                type="text"
                id="pais"
                name="pais"
                value={formData.pais}
                onChange={handleInputChange}
                readOnly
              />
            </div>
          </div>

          {/* Sección de Método de Pago */}
          <div className="payment-method-section">
            <h3>Método de Pago</h3>
            
            <div className="payment-method-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="payu"
                  checked={true}
                  readOnly
                />
                <span>PayU</span>
              </label>
            </div>

            {/* Campos de tarjeta de crédito para PayU */}
            <div className="credit-card-section">
              <h4>Datos de la Tarjeta</h4>
              
              <div className="form-group">
                <label htmlFor="cardNumber">Número de Tarjeta *</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="number"
                  placeholder="4111111111111111"
                  value={creditCardData.number}
                  onChange={handleCreditCardChange}
                  required
                  maxLength="19"
                />
                <small>Tarjeta de prueba: 4111111111111111</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cardName">Nombre en la Tarjeta *</label>
                  <input
                    type="text"
                    id="cardName"
                    name="name"
                    placeholder="APPROVED"
                    value={creditCardData.name}
                    onChange={handleCreditCardChange}
                    required
                  />
                  <small>Nombre de prueba: APPROVED</small>
                </div>

                <div className="form-group">
                  <label htmlFor="cardExpiry">Fecha de Vencimiento *</label>
                  <input
                    type="text"
                    id="cardExpiry"
                    name="expiry"
                    placeholder="2030/12"
                    value={creditCardData.expiry}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Asegurar formato YYYY/MM (formato PayU)
                      if (value.length === 4 && !value.includes('/')) {
                        value = value + '/';
                      }
                      setCreditCardData(prev => ({ ...prev, expiry: value }));
                    }}
                    required
                    maxLength="7"
                  />
                  <small>Formato: YYYY/MM (ej: 2030/12)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="cardCvv">CVV *</label>
                  <input
                    type="text"
                    id="cardCvv"
                    name="cvv"
                    placeholder="123"
                    value={creditCardData.cvv}
                    onChange={handleCreditCardChange}
                    required
                    maxLength="4"
                  />
                  <small>CVV de prueba: 123</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cardType">Tipo de Tarjeta</label>
                <select
                  id="cardType"
                  name="type"
                  value={creditCardData.type}
                  onChange={handleCreditCardChange}
                >
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">American Express</option>
                  <option value="DINERS">Diners Club</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resumen del Pedido */}
          <div className="order-summary">
            <h3>Resumen del Pedido</h3>
            <div className="summary-items">
              {cartItems.map((item, index) => (
                <div key={index} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.NombreProducto}</span>
                    <span className="item-size">Talla: {item.NombreTalla}</span>
                    <span className="item-quantity">Cantidad: {item.Cantidad}</span>
                  </div>
                  <span className="item-price">{formatPrice(item.Precio * item.Cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span className="total-amount">{formatPrice(getTotalPrice())}</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="checkout-buttons">
            <button 
              type="submit" 
              className="btn-checkout"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Pagar con PayU'}
            </button>
            
            <button 
              type="button" 
              className="btn-simulate"
              onClick={handleSimulatePayment}
              disabled={loading}
            >
              🎭 Simular Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;

