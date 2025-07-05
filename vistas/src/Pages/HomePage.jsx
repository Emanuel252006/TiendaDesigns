// src/Pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";           // solo CSS
import "../PagesCss/HomePages.css";
import { Carousel } from "react-bootstrap";               // React-Bootstrap Carousel
import Navigation from "../components/navegation.jsx";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";
import { getProductsRequest } from "../api/productApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function HomePage() {
  const [banners, setBanners]     = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    // Carga banners
    fetch(`${API_BASE}/api/carrusel`)
      .then(res => res.json())
      .then(data => setBanners(data.sort((a, b) => a.Orden - b.Orden)))
      .catch(console.error);

    // Carga productos destacados
    getProductsRequest()
      .then(data => setProductos(data.slice(0, 4)))
      .catch(console.error);
  }, []);

  return (
    <>
      <Navigation />

      {/* Carrusel con autoplay cada 3s y sin pausa al hover */}
      <div className="carousel-wrapper mb-5">
        {banners.length === 0 ? (
          <div className="no-banners">Sin banners</div>
        ) : (
          <Carousel
            controls={banners.length > 1}
            indicators={banners.length > 1}
            interval={3000}
            pause={false}
          >
            {banners.map((b, i) => (
              <Carousel.Item key={b.CarruselID}>
                <CustomImage
                  folder="carrusel"
                  filename={b.ImagenPath}
                  alt={`Banner ${i + 1}`}
                  className="d-block w-100 carousel-img"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </div>

      {/* Productos Destacados */}
      <section className="product-catalog py-5">
        <div className="container-fluid">
          <h2 className="text-center mb-4">Productos Destacados</h2>
          <div className="row justify-content-center">
            {productos.length === 0 && <p>No hay productos.</p>}
            {productos.map(p => (
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