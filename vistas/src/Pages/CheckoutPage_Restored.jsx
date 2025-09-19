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
  }, [user]); // Se ejecuta cuando cambia el usuario

  // Cargar datos también al montar el componente
  useEffect(() => {
    console.log('Componente montado - Usuario:', user);
    if (user) {
      console.log('Usuario ya disponible al montar, cargando datos...');
      loadUserData();
    }
  }, []); // Se ejecuta solo al montar

  // Cargar datos del usuario para checkout
  const loadUserData = async () => {
    console.log('🔄 loadUserData ejecutándose...');
    console.log('Usuario del contexto:', user);
    
    try {
      // Primero intentar cargar desde el backend
      console.log('📡 Haciendo petición al backend...');
      const response = await getCheckoutDataRequest();
      console.log('✅ Respuesta del backend:', response);
      
      if (response.data.success) {
        const userInfo = response.data.data;
        console.log('📋 Datos del usuario para checkout:', userInfo);
        
        // Pre-llenar todos los campos posibles
        const newFormData = {
          nombre: userInfo.nombre || user.NombreUsuario || '',
          email: userInfo.email || user.Correo || '',
          direccion: userInfo.direccion || user.Direccion || '',
          ciudad: userInfo.ciudad || user.Ciudad || '',
          codigoPostal: userInfo.codigoPostal || user.CodigoPostal || '',
          pais: userInfo.pais || user.Pais || 'Colombia',
          telefono: userInfo.telefono || user.Telefono || ''
        };
        
        console.log('📝 Nuevos datos del formulario:', newFormData);
        setFormData(prev => ({
          ...prev,
          ...newFormData
        }));
        console.log('✅ Formulario actualizado con datos del backend');
      } else {
        console.log('⚠️ Respuesta del backend sin success:', response.data);
        // Si no hay success, usar datos del contexto
        loadFromContext();
      }
    } catch (err) {
      console.error('❌ Error al cargar datos del usuario:', err);
      // Si falla, usar datos básicos del contexto
      loadFromContext();
    }
  };

  // Función auxiliar para cargar datos desde el contexto
  const loadFromContext = () => {
    console.log('🔄 loadFromContext ejecutándose...');
    console.log('Usuario del contexto para fallback:', user);
    
    if (user) {
      const contextData = {
        nombre: user.NombreUsuario || '',
        email: user.Correo || '',
        direccion: user.Direccion || '',
        ciudad: user.Ciudad || '',
        codigoPostal: user.CodigoPostal || '',
        pais: user.Pais || 'Colombia',
        telefono: user.Telefono || ''
      };
      
      console.log('📋 Datos del contexto:', contextData);
      setFormData(prev => ({
        ...prev,
        ...contextData
      }));
      console.log('✅ Formulario actualizado con datos del contexto');
    } else {
      console.log('⚠️ No hay usuario disponible en el contexto');
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
          expirationDate: creditCardData.expiry,
          cvv: creditCardData.cvv,
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
    const result = await Swal.fire({
      title: '🎭 Modo Simulación',
      text: '¿Simular un pago exitoso? Esto creará la orden, procesará el pago y limpiará el carrito.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, simular pago',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        setError('');

        // Preparar datos para la simulación
        const simulationData = {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          codigoPostal: formData.codigoPostal,
          pais: formData.pais,
          items: cartItems.map(item => ({
            ProductoID: item.ProductoID,
            TallaID: item.TallaID,
            Cantidad: item.Cantidad,
            Precio: item.Precio
          }))
        };

        const response = await checkoutApi.simulateCheckoutAndPayment(simulationData);

        if (response.success) {
          Swal.fire({
            title: '¡Simulación Exitosa!',
            html: `
              <p>Orden creada: <strong>#${response.data.orderId}</strong></p>
              <p>Total: <strong>$${response.data.total.toLocaleString()}</strong></p>
              <p>Estado: <strong>Pagado (Simulado)</strong></p>
            `,
            icon: 'success',
            confirmButtonText: 'Ver Dashboard'
          }).then(() => {
            navigate('/dashboard/ventas');
          });
        }
      } catch (err) {
        console.error('Error en simulación:', err);
        setError(err.error || 'Error en la simulación');
      } finally {
        setLoading(false);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Carrito Vacío</h2>
          <p>No hay productos en tu carrito para proceder al checkout.</p>
          <button onClick={() => navigate('/store')} className="btn-primary">
            Ir a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-content">
          <h1>Finalizar Compra</h1>
          
          <div className="checkout-grid">
            {/* Formulario de datos */}
            <div className="checkout-form-section">
              <h2>Información Personal y de Envío</h2>
              
              {user && (
                <div className="user-info-notice">
                  <p>Tu nombre y email ya están pre-llenados. Completa los datos de envío.</p>
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

                {error && <div className="error-message">{error}</div>}

                <div className="checkout-buttons">
                  <button 
                    type="button" 
                    className="btn-checkout"
                    onClick={handlePayUPayment}
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

            {/* Resumen del carrito */}
            <div className="checkout-summary">
              <h2>Resumen del Pedido</h2>
              
              <div className="cart-items-summary">
                {cartItems.map((item, index) => (
                  <div key={index} className="cart-item-summary">
                    <div className="item-image">
                      <img 
                        src={`http://localhost:3001/images/${item.Imagen}`} 
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
                  <span className="free-shipping">GRATIS</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

