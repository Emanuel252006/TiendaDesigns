import { OrderModelMySQL } from '../models/orderModelMySQL.js';

export const OrderController = {
  // Obtener pedidos pagados del usuario (solo pagados)
  async getUserOrders(req, res) {
    try {
      const userId = req.user.UsuarioID;
      
      console.log(`📦 Obteniendo pedidos activos para usuario: ${userId}`);
      
      const orders = await OrderModelMySQL.getActiveOrdersByUserId(userId);
      
      // Obtener detalles de cada orden
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await OrderModelMySQL.getOrderItems(order.OrdenID);
          return {
            ...order,
            items: items
          };
        })
      );
      
      console.log(`✅ Encontrados ${ordersWithDetails.length} pedidos activos`);
      
      res.json({
        success: true,
        orders: ordersWithDetails
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo pedidos del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener detalles de una orden específica
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.UsuarioID;
      
      console.log(`📦 Obteniendo detalles de orden ${orderId} para usuario: ${userId}`);
      
      // Verificar que la orden pertenece al usuario
      const order = await OrderModelMySQL.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      if (order.UsuarioID !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta orden'
        });
      }
      
      // Obtener items de la orden
      const items = await OrderModelMySQL.getOrderItems(orderId);
      
      res.json({
        success: true,
        order: {
          ...order,
          items: items
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo detalles de orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};
