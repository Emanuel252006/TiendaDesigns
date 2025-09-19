import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un código de verificación al correo del usuario
 * @param {string} to - Correo destino
 * @param {string} code - Código de verificación
 * @returns {Promise}
 */
export async function sendVerificationCode(to, code) {
  const mailOptions = {
    from: `TiendaDesigns <${process.env.CONTACT_EMAIL}>`,
    to,
    subject: 'Código de verificación - TiendaDesigns',
    html: `<p>Tu código de verificación es: <b>${code}</b></p><p>Si no solicitaste este registro, ignora este correo.</p>`
  };
  return transporter.sendMail(mailOptions);
}

/**
 * Envía email de confirmación de compra al cliente
 * @param {Object} orderData - Datos de la orden
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise}
 */
export async function sendPurchaseConfirmationEmail(orderData, paymentData) {
  const { 
    orderId, 
    customerName, 
    customerEmail, 
    items, 
    total, 
    shippingAddress 
  } = orderData;
  
  const { 
    transactionId, 
    paymentMethod, 
    paymentStatus, 
    paymentDate 
  } = paymentData;

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  // Generar HTML del email
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Compra - TiendaDesigns</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .success-icon {
          text-align: center;
          font-size: 48px;
          color: #28a745;
          margin: 20px 0;
        }
        .order-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .order-info h3 {
          color: #007bff;
          margin-top: 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: bold;
          color: #495057;
        }
        .info-value {
          color: #212529;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        .items-table th {
          background-color: #007bff;
          color: white;
          font-weight: bold;
        }
        .items-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .total-section {
          background-color: #e7f3ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .total-amount {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        .shipping-info {
          background-color: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
        .contact-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ¡Compra Confirmada!</h1>
          <p>Gracias por tu compra en TiendaDesigns</p>
        </div>

        <div class="success-icon">
          ✅
        </div>

        <div class="order-info">
          <h3>📋 Detalles de tu Orden</h3>
          <div class="info-row">
            <span class="info-label">Número de Orden:</span>
            <span class="info-value">#${orderId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha de Compra:</span>
            <span class="info-value">${formatDate(paymentDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${customerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado del Pago:</span>
            <span class="info-value" style="color: #28a745; font-weight: bold;">✅ ${paymentStatus}</span>
          </div>
        </div>

        <div class="order-info">
          <h3>💳 Información del Pago</h3>
          <div class="info-row">
            <span class="info-label">Método de Pago:</span>
            <span class="info-value">${paymentMethod}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ID de Transacción:</span>
            <span class="info-value">${transactionId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha de Pago:</span>
            <span class="info-value">${formatDate(paymentDate)}</span>
          </div>
        </div>

        <div class="order-info">
          <h3>📦 Productos Comprados</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.size}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.unitPrice)}</td>
                  <td>${formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <h3>💰 Total de tu Compra</h3>
          <div class="total-amount">${formatPrice(total)}</div>
        </div>

        <div class="shipping-info">
          <h3>🚚 Información de Envío</h3>
          <p><strong>Dirección:</strong> ${shippingAddress.address}</p>
          <p><strong>Ciudad:</strong> ${shippingAddress.city}</p>
          <p><strong>Código Postal:</strong> ${shippingAddress.postalCode || 'N/A'}</p>
          <p><strong>País:</strong> ${shippingAddress.country}</p>
        </div>

        <div class="contact-info">
          <h3>📞 ¿Necesitas Ayuda?</h3>
          <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos:</p>
          <p><strong>Email:</strong> ${process.env.CONTACT_EMAIL}</p>
          <p><strong>Teléfono:</strong> ${process.env.CONTACT_PHONE || 'Disponible en nuestro sitio web'}</p>
        </div>

        <div class="footer">
          <p>¡Gracias por elegir TiendaDesigns!</p>
          <p>Este es un correo automático, por favor no responder a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} TiendaDesigns. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `TiendaDesigns <${process.env.CONTACT_EMAIL}>`,
    to: customerEmail,
    subject: `✅ Compra Confirmada - Orden #${orderId} - TiendaDesigns`,
    html: htmlContent
  };

  try {
    console.log('📧 Enviando email de confirmación de compra a:', customerEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    throw error;
  }
} 