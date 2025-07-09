import { CartModel } from '../models/cartModel.js';

export const CartController = {
  // Obtener el carrito del usuario autenticado
  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cartItems = await CartModel.getCartByUserId(userId);
      
      // Filtrar solo los ítems que tienen ProductoID (no son null)
      const validCartItems = cartItems.filter(item => item.ProductoID !== null);
      
      // Calcular totales
      const subtotal = validCartItems.reduce((total, item) => {
        return total + (item.Precio * item.Cantidad);
      }, 0);
      
      const shipping = subtotal > 0 ? 20000 : 0; // Envío fijo de $20,000
      const total = subtotal + shipping;

      res.json({
        success: true,
        data: {
          items: validCartItems,
          summary: {
            subtotal,
            shipping,
            total,
            itemCount: validCartItems.length
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el carrito'
      });
    }
  },

  // Agregar producto al carrito
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { ProductoID, TallaID, Cantidad } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!ProductoID) {
        return res.status(400).json({ message: "ProductoID es requerido" });
      }

      if (!Cantidad || Cantidad <= 0) {
        return res.status(400).json({ message: "Cantidad debe ser mayor a 0" });
      }

      // Verificar stock disponible
      const stockDisponible = await CartModel.checkStock(ProductoID, TallaID);
      
      if (stockDisponible <= 0) {
        return res.status(400).json({ message: "No hay stock disponible para este producto" });
      }

      // Verificar cantidad en carrito + nueva cantidad no exceda stock
      const cantidadEnCarrito = await CartModel.getCartItemQuantity(userId, ProductoID, TallaID);
      const cantidadTotal = cantidadEnCarrito + Cantidad;
      
      if (cantidadTotal > stockDisponible) {
        return res.status(400).json({ message: "Stock insuficiente" });
      }

      // Agregar al carrito
      const cartItem = await CartModel.addToCart({
        UsuarioID: userId,
        ProductoID,
        TallaID,
        Cantidad
      });

      // Obtener carrito actualizado
      const cartItems = await CartModel.getCartByUserId(userId);
      const validCartItems = cartItems.filter(item => item.ProductoID !== null);
      const subtotal = validCartItems.reduce((total, item) => total + (item.Precio * item.Cantidad), 0);
      const shipping = subtotal > 0 ? 20000 : 0;
      const total = subtotal + shipping;

      res.status(200).json({
        message: "Producto agregado al carrito",
        cartItem,
        cart: {
          items: validCartItems,
          summary: {
            subtotal,
            shipping,
            total,
            itemCount: validCartItems.length
          }
        }
      });
    } catch (error) {
      console.error("Error en addToCart:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  // Actualizar cantidad de un ítem en el carrito
  async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { cartItemId } = req.params;
      const { cantidad } = req.body;

      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      // Obtener el ítem del carrito para verificar stock
      const cartItems = await CartModel.getCartByUserId(userId);
      const cartItem = cartItems.find(item => item.CarritoArticuloID == cartItemId);

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Ítem del carrito no encontrado'
        });
      }

      // Verificar stock disponible
      const stockDisponible = await CartModel.checkStock(cartItem.ProductoID);
      if (cantidad > stockDisponible) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`
        });
      }

      // Actualizar cantidad
      const updatedItem = await CartModel.updateCartItemQuantity(cartItemId, cantidad);

      res.json({
        success: true,
        message: 'Cantidad actualizada exitosamente',
        data: updatedItem
      });

    } catch (error) {
      console.error('Error al actualizar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el carrito'
      });
    }
  },

  // Eliminar ítem del carrito
  async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { cartItemId } = req.params;

      // Verificar que el ítem pertenece al usuario
      const cartItems = await CartModel.getCartByUserId(userId);
      const cartItem = cartItems.find(item => item.CarritoArticuloID == cartItemId);

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Ítem del carrito no encontrado'
        });
      }

      // Eliminar ítem
      await CartModel.removeFromCart(cartItemId);

      res.json({
        success: true,
        message: 'Producto eliminado del carrito exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar del carrito'
      });
    }
  },

  // Vaciar carrito completo
  async clearCart(req, res) {
    try {
      const userId = req.user.id;
      
      await CartModel.clearCart(userId);

      res.json({
        success: true,
        message: 'Carrito vaciado exitosamente'
      });

    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al vaciar el carrito'
      });
    }
  },

  // Verificar stock de un producto
  async checkStock(req, res) {
    try {
      const { ProductoID, TallaID } = req.params;
      
      const stock = await CartModel.checkStock(ProductoID, TallaID);
      
      res.json({
        success: true,
        data: { stock }
      });

    } catch (error) {
      console.error('Error al verificar stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar stock'
      });
    }
  }
}; 