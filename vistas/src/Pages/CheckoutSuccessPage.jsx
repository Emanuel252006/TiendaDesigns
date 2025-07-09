import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaFilePdf, FaCheckCircle, FaHome, FaStore } from 'react-icons/fa';
import '../PagesCss/CheckoutSuccessPage.css';
import { checkoutApi } from '../api/checkoutApi.js';

const CheckoutSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, whatsappLink, pdfUrl } = location.state || {};

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    const fetchOrderDetails = async () => {
      try {
        const response = await checkoutApi.getOrderDetails(orderId);
        if (response.success && response.data && response.data.length > 0) {
          setOrderDetails(response.data[0]);
        } else {
          setError('No se encontraron detalles del pedido.');
        }
      } catch (err) {
        setError('Error al obtener los detalles del pedido.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, navigate]);

  const handleWhatsAppClick = () => {
    window.open(whatsappLink, '_blank');
  };

  const handlePdfClick = () => {
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return <div className="success-container"><div className="success-content"><p>Cargando detalles del pedido...</p></div></div>;
  }
  if (error) {
    return <div className="success-container"><div className="success-content"><p>{error}</p></div></div>;
  }

  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-card">
          <div className="success-icon">
            <FaCheckCircle />
          </div>
          <h1>¡Pedido Confirmado!</h1>
          <p className="success-message">
            Tu pedido ha sido procesado exitosamente. <br />
            Número de orden: <strong>#{orderId}</strong>
          </p>

          <div className="order-profile-info">
            <h3>Datos del pedido</h3>
            <p><strong>Nombre:</strong> {orderDetails.NombreUsuario}</p>
            <p><strong>Email:</strong> {orderDetails.Correo}</p>
            <p><strong>Dirección:</strong> {orderDetails.Direccion}</p>
            <p><strong>Ciudad:</strong> {orderDetails.Ciudad}</p>
            <p><strong>País:</strong> {orderDetails.Pais}</p>
            <p><strong>Código Postal:</strong> {orderDetails.CodigoPostal}</p>
          </div>

          <div className="order-info">
            <h3>Próximos pasos:</h3>
            <ol>
              <li>Descarga tu factura PDF</li>
              <li>Contacta con nosotros por WhatsApp para coordinar el pago y envío</li>
              <li>Recibirás confirmación de tu pedido</li>
            </ol>
          </div>

          <div className="action-buttons">
            <button 
              onClick={handlePdfClick}
              className="btn-pdf"
            >
              <FaFilePdf />
              Descargar Factura
            </button>
            <button 
              onClick={handleWhatsAppClick}
              className="btn-whatsapp"
            >
              <FaWhatsapp />
              Contactar por WhatsApp
            </button>
          </div>

          <div className="navigation-buttons">
            <button 
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              <FaHome />
              Ir al Inicio
            </button>
            <button 
              onClick={() => navigate('/tienda')}
              className="btn-secondary"
            >
              <FaStore />
              Seguir Comprando
            </button>
          </div>

          <div className="contact-info">
            <h4>Información de contacto:</h4>
            <p>📧 Email: samuelarboleda004@gmail.com</p>
            <p>📱 WhatsApp: +57 310 419 6125</p>
            <p>⏰ Horario: Lunes a Viernes 9:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 