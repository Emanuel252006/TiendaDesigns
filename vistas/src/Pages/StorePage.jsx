// src/Pages/StorePage.jsx
import React, { useEffect, useState } from "react";
import "../PagesCss/StorePages.css";
import { getProductsRequest } from "../api/productApi";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";

export default function StorePage() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    getProductsRequest()
      .then((data) => setProductos(data))
      .catch(console.error);
  }, []);

  return (
    <div className="page-wrapper">
      <div className="additional-content">
        <h1>Bienvenido a Nuestra Tienda</h1>
        <p>
          Explora nuestros productos y descubre la calidad y el estilo que
          tenemos para ti.
        </p>
      </div>
      <div className="store-content">
        <div className="six-image-section">
          {productos.map((p) => (
            <div key={p.ProductoID} className="image-field">
              <CustomImage
                folder="productos"
                filename={p.Imagen}
                alt={p.NombreProducto}
                className="store-image"
              />
              <div className="product-info">
                <p className="product-name">{p.NombreProducto}</p>
                <p className="product-price">
                  ${parseFloat(p.Precio).toLocaleString()}
                </p>
                <DetalleButton
                  to={`/detalle/${p.ProductoID}`}
                  label="Ver detalle"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}