import React, { useState, useEffect } from 'react';
import { getUserOrders } from '../api/orderApi.js';
import Navigation from '../components/navegation.jsx';
import '../PagesCss/MisPedidosPage.css';

const MisPedidosPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getUserOrders();
      
      if (response.success) {
        setOrders(response.orders);
      } else {
        setError('Error cargando los pedidos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pagado': { class: 'badge-success', text: 'Pagado' },
      'Pendiente': { class: 'badge-warning', text: 'Pendiente' },
      'Enviado': { class: 'badge-info', text: 'Enviado' },
      'Entregado': { class: 'badge-secondary', text: 'Entregado' }
    };

    const config = statusConfig[status] || { class: 'badge-secondary', text: status };
    
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mt-5">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando tus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error</h4>
            <p>{error}</p>
            <button className="btn btn-outline-danger" onClick={loadOrders}>
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mt-5">
        <div className="row">
          <div className="col-12">
            <h1 className="mb-4">
              <i className="bi bi-box-seam me-2"></i>
              Mis Pedidos
            </h1>
            
            {orders.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-box-seam display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">No tienes pedidos pagados</h3>
                <p className="text-muted">
                  Aquí aparecerán tus pedidos pagados exitosamente. 
                  Solo se muestran pedidos con pago confirmado.
                </p>
                <a href="/tienda" className="btn btn-primary">
                  <i className="bi bi-shop me-2"></i>
                  Ir a la tienda
                </a>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.OrdenID} className="order-card mb-4">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-0">
                            Pedido #{order.OrdenID}
                          </h5>
                          <small className="text-muted">
                            {formatDate(order.FechaOrden)}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          {getStatusBadge(order.Estado)}
                          <span className="h5 mb-0 text-primary">
                            {formatPrice(order.Total)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-body">
                        {/* Dirección de envío */}
                        <div className="mb-3">
                          <h6 className="mb-2">
                            <i className="bi bi-geo-alt me-2"></i>
                            Dirección de envío
                          </h6>
                          <p className="mb-0 text-muted">
                            {order.Direccion}, {order.Ciudad}, {order.Pais} {order.CodigoPostal}
                          </p>
                        </div>

                        {/* Productos */}
                        <div className="mb-3">
                          <h6 className="mb-2">
                            <i className="bi bi-box me-2"></i>
                            Productos ({order.items.length})
                          </h6>
                          <div className="row">
                            {order.items.map((item, index) => (
                              <div key={index} className="col-md-6 mb-2">
                                <div className="d-flex align-items-center">
                                  <div className="me-3">
                                    {item.Imagen ? (
                                      <img 
                                        src={`http://localhost:3001/images/${item.Imagen}`}
                                        alt={item.NombreProducto}
                                        className="product-thumb"
                                      />
                                    ) : (
                                      <div className="product-thumb-placeholder">
                                        <i className="bi bi-image"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h6 className="mb-1">{item.NombreProducto}</h6>
                                    <small className="text-muted">
                                      Talla: {item.NombreTalla} | Cantidad: {item.Cantidad}
                                    </small>
                                    <div className="text-primary fw-bold">
                                      {formatPrice(item.Precio)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="row text-center">
                          <div className="col-md-4">
                            <small className="text-muted">ID de Transacción</small>
                            <div className="fw-bold">{order.PaymentId || 'N/A'}</div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">Código de Referencia</small>
                            <div className="fw-bold">{order.PreferenceId || 'N/A'}</div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">Total</small>
                            <div className="fw-bold text-primary">{formatPrice(order.Total)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisPedidosPage;
