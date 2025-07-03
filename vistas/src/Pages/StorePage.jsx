import React, { useEffect, useState } from "react";
import "../PagesCss/StorePages.css";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import { getProductsRequest } from "../api/productApi";

const StorePage = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await getProductsRequest();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    cargarProductos();
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
        {productos.map((producto) => {
  console.log("img:", producto.img);

  return (
 <div key={producto.ProductoID} className="image-field">
  <img
    src={`http://localhost:5001${producto.Imagen}`}
    alt={producto.NombreProducto}
    className="store-image"
    onError={(e) => {
      console.log("⚠️ No se pudo cargar:", producto.Imagen);
      e.target.src = "/images/default.png";
    }}
  />
  <div className="product-info">
    <p className="product-name">{producto.NombreProducto}</p>
    <p className="product-price">
      ${parseFloat(producto.Precio).toLocaleString()}
    </p>
    <DetalleButton
      to={`/detalle/${producto.ProductoID}`}
      label="Ver detalle"
    />
  </div>
</div>
  );
})}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StorePage;