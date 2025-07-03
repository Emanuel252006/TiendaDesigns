import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../PagesCss/HomePages.css";
import { getProductsRequest } from "../api/productApi";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import Navigation from "../components/navegation.jsx";

const HomePage = () => {
  const [productosDestacados, setProductosDestacados] = useState([]);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await getProductsRequest();
        // Si tu API marca los destacados, filtra aquí. 
        // Ejemplo: const destacados = data.filter(p => p.esDestacado);
        // Por simplicidad tomamos los primeros 5:
        const destacados = data.slice(0, 5);
        setProductosDestacados(destacados);
      } catch (error) {
        console.error("Error al cargar productos destacados:", error);
      }
    };
    cargarProductos();
  }, []);

  return (
    <>
      {/* Navbar */}
      <Navigation />

      {/* Header */}
      <header className="main-header position-relative">
        <div className="container-fluid">
          <div className="header-image position-relative">
            <img
              src="src/images/imggrande.jpg"
              alt="Moda Formal"
              className="img-fluid header-img"
            />
            <div className="header-overlay">
              <h1 className="header-title">Elegancia y Estilo en Ropa Formal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Catálogo de Productos Destacados */}
      <section className="product-catalog py-5">
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-center">Productos Destacados</h2>
            </div>
          </div>

          <div className="row justify-content-center">
            {productosDestacados.length === 0 ? (
              <p>No hay productos destacados en este momento.</p>
            ) : (
              productosDestacados.map((producto) => (
                <div
                  key={producto.ProductoID}
                  className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center"
                >
                  <div className="card">
                    <img
                      src={`http://localhost:5001${producto.Imagen}`}
                      alt={producto.NombreProducto}
                      className="card-img-top"
                      onError={(e) => (e.target.src = "/images/default.png")}
                    />
                    <div className="card-body text-center">
                      <h5 className="card-title">{producto.NombreProducto}</h5>
                      <p className="card-text">
                        ${parseFloat(producto.Precio).toLocaleString()}
                      </p>
                      <DetalleButton
                        to={`/detalle/${producto.ProductoID}`}
                        label="Ver Detalle"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botón “VER TODO” */}
          <div className="row mt-4">
            <div className="col text-center">
              <a href="/tienda" className="btn btn-secondary">
                VER TODO
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;