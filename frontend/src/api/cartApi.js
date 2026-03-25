import axios from './axios.js';

export const cartApi = {
  // Obtener carrito del usuario
  async getCart() {
    const response = await axios.get('/cart');
    return response.data;
  },

  // Agregar producto al carrito
  async addToCart(productData) {
    const response = await axios.post('/cart/add', productData);
    return response.data;
  },

  // Actualizar cantidad de un ítem
  async updateCartItem(cartItemId, cantidad) {
    const response = await axios.put(`/cart/item/${cartItemId}`, { cantidad });
    return response.data;
  },

  // Eliminar ítem del carrito
  async removeFromCart(cartItemId) {
    const response = await axios.delete(`/cart/item/${cartItemId}`);
    return response.data;
  },

  // Vaciar carrito completo
  async clearCart() {
    const response = await axios.delete('/cart/clear');
    return response.data;
  },

  // Verificar stock de un producto
  async checkStock(productoId, tallaId) {
    const response = await axios.get(`/cart/stock/${productoId}/${tallaId}`);
    return response.data;
  }
}; 