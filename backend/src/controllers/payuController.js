import { createPayUPayment, getPayUTransactionStatus, generatePayURedirectUrl } from '../services/payuService.js';
import { CartModel } from '../models/cartModel.js';
import { OrderModelMySQL } from '../models/orderModelMySQL.js';
import { PaymentModel } from '../models/paymentModel.js';
import { PDFService } from '../services/pdfService.js';
import { sendPurchaseConfirmationEmail } from '../services/emailService.js';

export const PayUController = {
  /**
   * Crear pago con PayU
   */
  createPayment: async (req, res) => {
    try {
      const userId = req.user.UsuarioID;
      const { 
        creditCard, 
        billingAddress,
        useRedirect = false // Si true, usa formulario de PayU, si false, usa API directa
      } = req.body;

      console.log('🚀 Iniciando proceso de pago PayU para usuario:', userId);
      console.log('🔍 req.user completo:', req.user);

      // 1. Obtener carrito del usuario
      const cart = await CartModel.getCartByUserId(userId);
      console.log('🛒 Carrito obtenido:', cart);
      if (!cart || cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El carrito está vacío'
        });
      }

      // 2. Calcular total
      const total = cart.reduce((sum, item) => {
        return sum + (item.Precio * item.Cantidad);
      }, 0);

      console.log('💰 Total calculado:', total);

      // 3. Generar código de referencia único
      const referenceCode = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 4. Preparar datos para PayU
      const paymentData = {
        referenceCode,
        description: `Compra en Tienda Designs - ${cart.length} producto(s)`,
        amount: total,
        currency: 'COP',
        buyerEmail: req.user.Correo,
        buyerName: req.user.NombreUsuario,
        buyerPhone: billingAddress?.telefono || req.user.Telefono || '3001234567',
        buyerAddress: billingAddress?.direccion || req.user.Direccion || 'Calle 123 #45-67',
        buyerCity: billingAddress?.ciudad || req.user.Ciudad || 'Bogotá',
        buyerCountry: 'CO',
        paymentMethod: creditCard?.type || 'VISA',
        creditCard: {
          number: creditCard?.number || '4037997623271984', // Tarjeta del informe que funcionaba
          name: creditCard?.name || 'APPROVED',
          expirationDate: creditCard?.expirationDate || '2030/12', // Formato YYYY/MM
          cvv: creditCard?.cvv || '321'
        },
        test: true
      };

      console.log('📋 Datos del pago:', paymentData);

      // 5. Crear pago en PayU
      console.log('🔧 Procesando pago con PayU...');
      const payuResponse = await createPayUPayment(paymentData);

      if (!payuResponse.success) {
        console.error('❌ Error en PayU:', payuResponse.error);
        return res.status(400).json({
          success: false,
          message: 'Error procesando el pago con PayU',
          error: payuResponse.error,
          details: payuResponse.details
        });
      }

      const payuData = payuResponse.data;
      console.log('✅ Respuesta PayU:', payuData);

      // Si PayU devuelve error, manejarlo
      if (payuData.code === 'ERROR') {
        console.error('❌ PayU reportó error:', payuData.error);
        return res.status(400).json({
          success: false,
          message: 'PayU rechazó la transacción',
          error: payuData.error
        });
      }

      // 6. Crear la orden ANTES del pago (flujo original PayU)
      const orderData = {
        UsuarioID: userId,
        FechaOrden: new Date(),
        Estado: payuData.transactionResponse?.state === 'APPROVED' ? 'Pagado' : 'Pendiente',
        Total: total,
        DireccionEnvio: billingAddress?.direccion || req.user.Direccion,
        CiudadEnvio: billingAddress?.ciudad || req.user.Ciudad,
        CodigoPostalEnvio: req.user.CodigoPostal,
        PaisEnvio: req.user.Pais,
        TelefonoContacto: billingAddress?.telefono || req.user.Telefono,
        PaymentId: payuData.transactionResponse?.transactionId,
        PreferenceId: referenceCode
      };

      // Preparar datos de items (sin agregarlos aún)
      const orderItems = cart.map(item => ({
        ProductoID: item.ProductoID,
        TallaID: item.TallaID,
        Cantidad: item.Cantidad,
        Precio: item.Precio
      }));

      // Limpiar carrito y procesar orden SOLO si el pago fue aprobado
      if (payuData.transactionResponse?.state === 'APPROVED') {
        let newOrder;
        let orderId;
        
        try {
          // Crear la orden solo si el pago es aprobado
          newOrder = await OrderModelMySQL.createOrder(orderData);
          orderId = newOrder.OrdenID;
          console.log('📦 Orden creada:', newOrder);

          // Agregar productos a la orden (esto descuenta el stock automáticamente)
          await OrderModelMySQL.addOrderItems(orderId, orderItems);
          console.log('📦 Items agregados a la orden y stock actualizado');
          
        } catch (orderError) {
          console.error('❌ Error procesando orden:', orderError);
          
          // Si se creó la orden pero falló al agregar items, eliminar la orden huérfana
          if (orderId) {
            try {
              await OrderModelMySQL.deleteOrder(orderId);
              console.log('🧹 Orden huérfana eliminada:', orderId);
            } catch (deleteError) {
              console.error('❌ Error eliminando orden huérfana:', deleteError);
            }
          }
          
          return res.status(500).json({
            success: false,
            message: 'Error procesando la orden después del pago exitoso',
            error: orderError.message
          });
        }

        // Limpiar carrito
        await CartModel.clearCart(userId);
        console.log('🛒 Carrito limpiado');

        // Guardar transacción en base de datos
        const transactionData = {
          ReferenceCode: referenceCode,
          TransactionId: payuData.transactionResponse?.transactionId,
          State: payuData.transactionResponse?.state,
          ResponseMessage: payuData.transactionResponse?.responseMessage,
          PaymentMethod: creditCard?.type || 'VISA',
          Amount: total,
          OrdenID: orderId
        };

        const savedTransaction = await PaymentModel.createPayment(transactionData);
        console.log('💾 Transacción guardada:', savedTransaction);

        // Enviar email de confirmación
        try {
          const emailOrderData = {
            orderId: orderId,
            customerName: req.user.NombreUsuario,
            customerEmail: req.user.Correo,
            items: cart.map(item => ({
              productName: item.NombreProducto || 'Producto',
              size: item.NombreTalla || 'N/A',
              quantity: item.Cantidad,
              unitPrice: parseFloat(item.Precio)
            })),
            total: total,
            shippingAddress: {
              address: billingAddress?.direccion || req.user.Direccion,
              city: billingAddress?.ciudad || req.user.Ciudad,
              postalCode: req.user.CodigoPostal,
              country: req.user.Pais || 'Colombia'
            }
          };

          const emailPaymentData = {
            transactionId: payuData.transactionResponse?.transactionId,
            paymentMethod: creditCard?.type || 'VISA',
            paymentStatus: payuData.transactionResponse?.state,
            paymentDate: new Date()
          };

          await sendPurchaseConfirmationEmail(emailOrderData, emailPaymentData);
          console.log('📧 Email de confirmación enviado para pago PayU');
        } catch (emailError) {
          console.error('❌ Error enviando email de confirmación (PayU):', emailError);
        }

        return res.json({
          success: true,
          message: 'Pago PayU procesado exitosamente',
          orderId: orderId,
          transactionId: payuData.transactionResponse?.transactionId,
          state: payuData.transactionResponse?.state,
          amount: total,
          pdfUrl: `/invoices/order_${orderId}.pdf`
        });

      } else {
        // Si el pago fue rechazado, no crear orden ni descontar stock
        console.log('❌ Pago rechazado - No se crea orden ni se descuenta stock');
        
        return res.status(400).json({
          success: false,
          message: 'Pago rechazado por PayU',
          error: payuData.transactionResponse?.responseMessage || 'Transacción rechazada',
          state: payuData.transactionResponse?.state
        });
      }

    } catch (error) {
      console.error('❌ Error en PayUController:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Crear URL de redirección para PayU (formulario)
   */
  createRedirectPayment: async (req, res) => {
    try {
      const userId = req.user.UsuarioID;
      const { billingAddress } = req.body;

      console.log('🚀 Creando URL de redirección PayU para usuario:', userId);

      // 1. Obtener carrito del usuario
      const cart = await CartModel.getCartByUserId(userId);
      if (!cart || cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El carrito está vacío'
        });
      }

      // 2. Calcular total
      const total = cart.reduce((sum, item) => {
        return sum + (item.Precio * item.Cantidad);
      }, 0);

      // 3. Generar código de referencia único
      const referenceCode = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 4. Preparar datos para PayU
      const paymentData = {
        referenceCode,
        description: `Compra en Tienda Designs - ${cart.length} producto(s)`,
        amount: total,
        currency: 'COP',
        buyerEmail: req.user.email,
        buyerName: req.user.nombre,
        buyerPhone: billingAddress?.telefono || '3001234567',
        buyerAddress: billingAddress?.direccion || 'Calle 123 #45-67',
        buyerCity: billingAddress?.ciudad || 'Bogotá',
        buyerCountry: 'CO'
      };

      // 5. Generar URL de redirección
      const redirectUrl = generatePayURedirectUrl(paymentData);

      // 6. Guardar datos de la transacción pendiente (usando campos existentes)
      const transactionData = {
        ReferenceCode: referenceCode,
        TransactionId: null,
        State: 'PENDING',
        ResponseMessage: 'Redireccionado a PayU',
        PaymentMethod: 'REDIRECT',
        Amount: total
      };

      await PaymentModel.createPayment(transactionData);

      return res.json({
        success: true,
        message: 'URL de redirección generada',
        data: {
          redirectUrl,
          referenceCode,
          amount: total,
          cartItems: cart.length
        }
      });

    } catch (error) {
      console.error('❌ Error creando redirección PayU:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando URL de redirección',
        error: error.message
      });
    }
  },

  /**
   * Webhook de notificación de PayU
   */
  handleNotification: async (req, res) => {
    try {
      console.log('🔔 Notificación recibida de PayU:', req.body);
      
      const { 
        referenceCode, 
        transactionState, 
        transactionId,
        orderId,
        responseCode,
        responseMessage 
      } = req.body;

      if (!referenceCode) {
        return res.status(400).json({
          success: false,
          message: 'ReferenceCode es requerido'
        });
      }

      // Buscar transacción en base de datos
      const transaction = await PaymentModel.getPaymentByReference(referenceCode);
      
      if (!transaction) {
        console.log('⚠️ Transacción no encontrada:', referenceCode);
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      // Actualizar estado de la transacción
      await PaymentModel.updatePaymentStatus(referenceCode, {
        TransactionId: transactionId,
        OrderId: orderId,
        State: transactionState,
        ResponseCode: responseCode,
        ResponseMessage: responseMessage,
        OperationDate: new Date()
      });

      console.log('✅ Transacción actualizada:', referenceCode, transactionState);

      // Si el pago fue aprobado, crear la orden
      if (transactionState === 'APPROVED' && transaction.UsuarioID) {
        console.log('✅ Pago aprobado, creando orden...');
        
        try {
          // Aquí podrías implementar la lógica para crear la orden
          // Similar a como se hace en createPayment
          console.log('📦 Orden será creada para usuario:', transaction.UsuarioID);
        } catch (orderError) {
          console.error('❌ Error creando orden:', orderError);
        }
      }

      res.json({
        success: true,
        message: 'Notificación procesada'
      });

    } catch (error) {
      console.error('❌ Error procesando notificación PayU:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando notificación',
        error: error.message
      });
    }
  },

  /**
   * Verificar estado de transacción
   */
  getTransactionStatus: async (req, res) => {
    try {
      const { referenceCode } = req.params;

      const status = await getPayUTransactionStatus(referenceCode);
      
      if (!status.success) {
        return res.status(400).json({
          success: false,
          message: 'Error verificando estado',
          error: status.error
        });
      }

      res.json({
        success: true,
        data: status.data
      });

    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Simular pago para pruebas (similar al sistema actual)
   */
  simulatePayment: async (req, res) => {
    try {
      const userId = req.user.UsuarioID;
      console.log('🎭 Simulando pago PayU para usuario:', userId);

      // 1. Obtener carrito del usuario
      const cart = await CartModel.getCartByUserId(userId);
      if (!cart || cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El carrito está vacío'
        });
      }

      // 2. Calcular total
      const total = cart.reduce((sum, item) => {
        return sum + (item.Precio * item.Cantidad);
      }, 0);

      // 3. Generar código de referencia único
      const referenceCode = `SIM_${Date.now()}_${userId}`;

      // 4. Simular respuesta exitosa de PayU
      const simulatedPayUResponse = {
        code: 'SUCCESS',
        error: null,
        transactionResponse: {
          orderId: `SIM_${Date.now()}`,
          transactionId: `SIM_TXN_${Date.now()}`,
          state: 'APPROVED',
          paymentNetworkResponseCode: '00',
          paymentNetworkResponseErrorMessage: 'APPROVED',
          trazabilityCode: `SIM_TRACE_${Date.now()}`,
          authorizationCode: `SIM_AUTH_${Date.now()}`,
          pendingReason: null,
          responseCode: 'APPROVED',
          responseMessage: 'Transacción aprobada (SIMULADA)',
          transactionDate: new Date().toISOString(),
          transactionTime: new Date().toISOString(),
          operationDate: new Date().toISOString(),
          extraParameters: {
            BANK_REFERENCED_CODE: `SIM_BANK_${Date.now()}`
          }
        }
      };

      // 5. Guardar transacción simulada (usando campos existentes)
      const transactionData = {
        ReferenceCode: referenceCode,
        TransactionId: simulatedPayUResponse.transactionResponse.transactionId,
        State: 'APPROVED',
        ResponseMessage: 'Transacción aprobada (SIMULADA)',
        PaymentMethod: 'SIMULATION',
        Amount: total
      };

      const savedTransaction = await PaymentModel.createPayment(transactionData);
      console.log('💾 Transacción simulada guardada:', savedTransaction);

      // 6. Crear orden
      const orderData = {
        UsuarioID: userId,
        Estado: 'Pagado',
        Total: total,
        DireccionEntrega: JSON.stringify({
          direccion: 'Dirección de prueba (Simulación)',
          ciudad: 'Bogotá',
          telefono: '3001234567'
        }),
        PaymentId: simulatedPayUResponse.transactionResponse.transactionId,
        PreferenceId: referenceCode
      };

      let newOrder;
      try {
        newOrder = await OrderModelMySQL.createOrder(orderData);
        console.log('📦 Orden creada:', newOrder);

        // 7. Agregar productos a la orden
        for (const item of cart) {
          await OrderModelMySQL.addOrderItem({
            OrdenID: newOrder.insertId,
            ProductoID: item.ProductoID,
            TallaID: item.TallaID,
            Cantidad: item.Cantidad,
            PrecioUnitario: item.Precio
          });
        }
      } catch (orderError) {
        console.error('❌ Error procesando orden simulada:', orderError);
        
        // Si se creó la orden pero falló al agregar items, eliminar la orden huérfana
        if (newOrder?.insertId) {
          try {
            await OrderModelMySQL.deleteOrder(newOrder.insertId);
            console.log('🧹 Orden simulada huérfana eliminada:', newOrder.insertId);
          } catch (deleteError) {
            console.error('❌ Error eliminando orden simulada huérfana:', deleteError);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error procesando la orden simulada',
          error: orderError.message
        });
      }

      // 8. Limpiar carrito
      await CartModel.clearCart(userId);
      console.log('🛒 Carrito limpiado');

      // 9. Generar PDF de factura (opcional)
      try {
        const pdfBuffer = await PDFService.generateInvoice({
          orderId: newOrder.insertId,
          userId: userId,
          total: total,
          items: cart
        });
        console.log('📄 PDF generado exitosamente');
      } catch (pdfError) {
        console.warn('⚠️ Error generando PDF:', pdfError.message);
      }

      return res.json({
        success: true,
        message: 'Pago simulado exitosamente con PayU',
        data: {
          orderId: newOrder.insertId,
          transactionId: simulatedPayUResponse.transactionResponse.transactionId,
          referenceCode: referenceCode,
          amount: total,
          state: 'APPROVED',
          simulation: true,
          payuResponse: simulatedPayUResponse
        }
      });

    } catch (error) {
      console.error('❌ Error simulando pago PayU:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};
