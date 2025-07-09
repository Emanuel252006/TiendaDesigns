// src/Pages/StorePage.jsx
import React, { useEffect, useState } from "react";
import "../PagesCss/StorePages.css";
import { getProductsRequest } from "../api/productApi";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";

export default function StorePage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProductsRequest()
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="store-page">
        <div className="store-header">
          <div className="container">
            <h1>Nuestra Colección</h1>
            <p>Descubre el estilo y la elegancia en cada prenda</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando productos...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Header elegante */}
      <div className="store-header">
        <div className="container">
          <h1>Nuestra Colección</h1>
          <p>Descubre el estilo y la elegancia en cada prenda</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="store-content">
        <div className="container">
          {/* Filtros y ordenamiento (futuro) */}
          <div className="store-controls">
            <div className="products-count">
              {productos.length} productos disponibles
            </div>
          </div>

          {/* Grid de productos */}
          <div className="products-grid">
            {productos.map((producto) => (
              <div key={producto.ProductoID} className="product-card">
                <div className="product-image-container">
                  <CustomImage
                    folder="productos"
                    filename={producto.Imagen}
                    alt={producto.NombreProducto}
                    className="product-image"
                  />
                  <div className="product-overlay">
                    <DetalleButton
                      to={`/detalle/${producto.ProductoID}`}
                      label="Ver Detalle"
                      className="overlay-button"
                    />
                  </div>
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{producto.NombreProducto}</h3>
                  <p className="product-price">
                    ${parseFloat(producto.Precio).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje si no hay productos */}
          {productos.length === 0 && (
            <div className="no-products">
              <h3>No hay productos disponibles</h3>
              <p>Pronto tendremos nuevas colecciones para ti</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}