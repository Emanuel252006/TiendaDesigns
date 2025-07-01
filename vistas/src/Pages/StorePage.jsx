import React from "react";
import "../PagesCss/StorePages.css";
import DetalleButton from "../components/DetalleButton.jsx"; 
import Footer from "../components/Footer.jsx";

const StorePage = () => {
  return (
    <div className="page-wrapper">
      {/* Área para contenido adicional */}
      <div className="additional-content">
        <h1>Bienvenido a Nuestra Tienda</h1>
        <p>
          Explora nuestros productos y descubre la calidad y el estilo que tenemos para ti.
        </p>
      </div>

      {/* Contenido principal de la tienda */}
      <div className="store-content">
        {/* Sección de 6 campos para imágenes con información de producto */}
        <div className="six-image-section">
          {/* Producto 1 */}
          <div className="image-field">
            <img
              src="src/images/camisa blanca.png"
              alt="camiseta blanca"
              className="store-image"
            />
            <div className="product-info">
              <p className="product-name">Camisa Blanca</p>
              <p className="product-price">$30.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
          {/* Producto 2 */}
          <div className="image-field">
            <img
              src="src/images/traje azul.png"
              alt="traje azul"
              className="store-image"
            />
            <div className="product-info">
              <p className="product-name">Blazer Azul</p>
              <p className="product-price">$120.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
          {/* Producto 3 */}
          <div className="image-field">
            <img
              src="src/images/destacada1.jpg"
              alt="camisa formal blanca"
              className="store-image"
            />
            <div className="product-info">
              <p className="product-name">Suéter Beige</p>
              <p className="product-price">$45.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
          {/* Producto 4 */}
          <div className="image-field">
            <img
              src="src/images/destacada2.jpg"
              alt="zapatos formales blancos"
              className="store-image"
            />
            <div className="product-info">
              <p className="product-name">Zapatos Formales</p>
              <p className="product-price">$60.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
          {/* Producto 5 */}
          <div className="image-field">
            <img
              src="src/images/destacada3.jpg"
              alt="pantalon cafe"
              className="store-image"
            />
            <div className="product-info">
              <p className="product-name">Pantalón Café</p>
              <p className="product-price">$50.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
          {/* Producto 6 */}
          <div className="image-field">
            <img src="" alt="Producto 6" className="store-image" />
            <div className="product-info">
              <p className="product-name">Producto 6</p>
              <p className="product-price">$00.000</p>
              <DetalleButton to="/detalle" label="Ver detalle" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StorePage;
