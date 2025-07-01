import React from "react";
import "../PagesCss/Cart.css"; 
import Footer from "../components/Footer";

const CartPage = () => {
  return (
    <div className="cart-page">
      <div className="container mt-5">
        <h2 className="cart-title">🛒 Carrito de Compras</h2>
        
        {/* Sección de productos en el carrito */}
        <div className="cart-items">
          {/* Producto Ejemplo 1 */}
          <div className="cart-item">
            <img
              src="../src/images/destacada2.jpg"
              alt="Zapatos clásicos"
              className="cart-item-image"
            />
            <div className="cart-item-info">
              <h5>Zapatos de vestir clásicos</h5>
              <p>
                Tamaño: <strong>41</strong>
              </p>
              <p>
                Precio unitario: <strong>$200,000.00</strong>
              </p>
              <div className="quantity-selector">
                <button className="btn btn-outline-secondary">-</button>
                <input
                  type="text"
                  value="1"
                  className="quantity-input"
                  readOnly
                />
                <button className="btn btn-outline-secondary">+</button>
              </div>
            </div>
            <div className="cart-item-actions">
              <button className="btn btn-danger">Eliminar</button>
            </div>
          </div>

          {/* Producto Ejemplo 2 */}
          <div className="cart-item">
            <img
              src="../src/images/destacada1.jpg"
              alt="Camisa elegante"
              className="cart-item-image"
            />
            <div className="cart-item-info">
              <h5>Camisa Elegante</h5>
              <p>
                Tamaño: <strong>M</strong>
              </p>
              <p>
                Precio unitario: <strong>$120,000.00</strong>
              </p>
              <div className="quantity-selector">
                <button className="btn btn-outline-secondary">-</button>
                <input
                  type="text"
                  value="2"
                  className="quantity-input"
                  readOnly
                />
                <button className="btn btn-outline-secondary">+</button>
              </div>
            </div>
            <div className="cart-item-actions">
              <button className="btn btn-danger">Eliminar</button>
            </div>
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="cart-summary">
          <h4>Resumen del Pedido</h4>
          <div className="summary-item">
            <span>Subtotal:</span>
            <strong>$440,000.00</strong>
          </div>
          <div className="summary-item">
            <span>Envío:</span>
            <strong>$20,000.00</strong>
          </div>
          <hr />
          <div className="summary-total">
            <span>Total:</span>
            <strong>$460,000.00</strong>
          </div>
          <button className="btn btn-success btn-lg btn-block bg-black">
            Ir a la Área de Pago
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
