// src/Pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../PagesCss/HomePages.css";
import { getProductsRequest } from "../api/productApi";
import Navigation from "../components/navegation.jsx";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function HomePage() {
  const [banners, setBanners] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/carrusel`)
      .then((r) => r.json())
      .then((data) =>
        setBanners(data.sort((a, b) => a.Orden - b.Orden))
      )
      .catch(console.error);

    getProductsRequest()
      .then((data) => setProductos(data.slice(0, 4)))
      .catch(console.error);
  }, []);

  return (
    <>
      <Navigation />

      {/* Carrusel */}
      <div
        id="homeCarousel"
        className="carousel slide mb-5"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          {banners.length === 0 && (
            <div className="carousel-item active">
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: 300 }}
              >
                Sin banners
              </div>
            </div>
          )}
          {banners.map((b, i) => (
            <div
              key={b.CarruselID}
              className={`carousel-item${i === 0 ? " active" : ""}`}
            >
              <CustomImage
                folder="carrusel"
                filename={b.ImagenPath}
                alt={`Banner ${i + 1}`}
                className="d-block w-100 carousel-img"
              />
            </div>
          ))}
        </div>
        {banners.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#homeCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" />
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#homeCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon" />
            </button>
          </>
        )}
      </div>

      {/* Productos Destacados */}
      <section className="product-catalog py-5">
        <div className="container-fluid">
          <h2 className="text-center mb-4">Productos Destacados</h2>
          <div className="row justify-content-center">
            {productos.length === 0 && <p>No hay productos.</p>}
            {productos.map((p) => (
              <div
                key={p.ProductoID}
                className="col-lg-2 col-md-3 col-sm-4 mb-4 d-flex justify-content-center"
              >
                <div className="card">
                  <CustomImage
                    folder="productos"
                    filename={p.Imagen}
                    alt={p.NombreProducto}
                    className="card-img-top"
                  />
                  <div className="card-body text-center">
                    <h5 className="card-title">{p.NombreProducto}</h5>
                    <p className="card-text">
                      ${parseFloat(p.Precio).toLocaleString()}
                    </p>
                    <DetalleButton
                      to={`/detalle/${p.ProductoID}`}
                      label="Ver Detalle"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
}