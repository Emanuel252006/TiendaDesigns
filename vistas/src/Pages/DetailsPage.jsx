// src/Pages/ProductPage.jsx
import React from "react";
import "../PagesCss/Detail.css";
import Footer from "../components/Footer.jsx"; // Ajusta la ruta según tu estructura

const ProductPage = () => {
  return (
    <div className="product-page-wrapper">
      {/* Contenedor interno del contenido principal para aplicar padding lateral */}
      <div className="main-content">
        {/* Sección de imagen del producto */}
        <div className="product-image-section">
          <img
            src="" // Coloca aquí la ruta de tu imagen
            alt="Imagen del producto"
            className="product-image"
          />
        </div>

        {/* Sección de información del producto */}
        <div className="product-info-section">
          <h2 className="product-title">Nombre del Producto</h2>
          <p className="product-price">$00.000,00</p>
          <p className="product-description">
            Breve descripción del producto. Aquí se explica de manera concisa las
            características y beneficios del mismo.
          </p>

          {/* Opciones del producto */}
          <div className="product-options">
            <label htmlFor="size">Tamaño:</label>
            <select id="size" name="size" className="product-size">
              <option value="">Selecciona Tamaño</option>
              {/* Opciones adicionales */}
            </select>
          </div>

          {/* Cantidad del producto */}
          <div className="product-quantity">
            <label htmlFor="quantity">Cantidad:</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              defaultValue="1"
              className="product-quantity-input"
            />
          </div>

          {/* Botón para añadir al carrito */}
          <button className="add-to-cart-button">Añadir al carrito</button>
        </div>
      </div>
      {/* Footer insertado como componente */}
      <Footer />
    </div>
  );
};

export default ProductPage;
