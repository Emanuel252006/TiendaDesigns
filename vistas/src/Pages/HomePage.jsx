// src/Pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";           // solo CSS
import "../PagesCss/HomePages.css";
import { Carousel } from "react-bootstrap";               // React-Bootstrap Carousel
import Navigation from "../components/navegation.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";
import CarruselModal from "../components/CarruselModal.jsx";
import DestacadosControls from "../components/DestacadosControls.jsx";
import DetalleButton from "../components/DetalleButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function HomePage() {
  const [banners, setBanners] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCarruselModal, setShowCarruselModal] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    cargarDatos();
  }, []);

  // Agregar clase al body para el padding específico de la página de inicio
  useEffect(() => {
    document.body.classList.add('homepage-body');
    
    // Limpiar la clase cuando el componente se desmonte
    return () => {
      document.body.classList.remove('homepage-body');
    };
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carga banners
      const bannersResponse = await fetch(`${API_BASE}/api/carrusel`);
      if (bannersResponse.ok) {
        const bannersData = await bannersResponse.json();
        setBanners(bannersData.sort((a, b) => a.Orden - b.Orden));
      } else {
        console.error('Error cargando banners:', bannersResponse.status);
      }

      // Carga productos destacados dinámicos
      const productosResponse = await fetch(`${API_BASE}/api/products/destacados`);
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        console.log('Productos recibidos del backend:', productosData);
        console.log('Cantidad de productos:', productosData.length);
        // Asegurar que productosData sea un array
        setProductos(Array.isArray(productosData) ? productosData : []);
      } else {
        console.error('Error cargando productos destacados:', productosResponse.status);
        setProductos([]); // Fallback a array vacío
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando datos');
      setProductos([]); // Fallback a array vacío
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si el usuario es admin
  const isAdmin = user && user.Rol === 'Admin';
  
  // Debug logs
  console.log('User:', user);
  console.log('Is Admin:', isAdmin);

  // Función para actualizar datos después de cambios
  const handleUpdate = () => {
    cargarDatos();
  };

  return (
    <div className="home-page">
      <Navigation />

      {/* Carrusel con autoplay cada 3s y sin pausa al hover */}
      <div className="carousel-container" style={{ marginTop: '0', paddingTop: '0' }}>
        {/* Botón de gestión del carrusel para admin */}
        {isAdmin && (
          <div className="admin-controls">
            <button 
              className="btn btn-dark btn-sm"
              onClick={() => setShowCarruselModal(true)}
            >
              <i className="fas fa-images"></i> Gestionar Carrusel
            </button>
          </div>
        )}
        
        {banners.length > 0 ? (
          <Carousel 
            id="homeCarousel"
            interval={3000} 
            pause={false}
            indicators={true}
            controls={true}
          >
            {banners.map((banner, index) => (
              <Carousel.Item key={banner.CarruselID}>
                <CustomImage
                  folder="carrusel"
                  filename={banner.ImagenPath}
                  alt={`Banner ${index + 1}`}
                  className="d-block w-100 carousel-img"
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <div className="carousel-placeholder">
            <p>No hay banners disponibles</p>
          </div>
        )}
      </div>

      {/* Productos Destacados */}
      <section className="product-catalog py-5">
        <div className="container-fluid">
          {isAdmin ? (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="text-start mb-0">Productos Destacados</h2>
              <DestacadosControls onUpdate={handleUpdate} />
            </div>
          ) : (
            <div className="text-center mb-4">
              <h2 className="mb-0">Productos Destacados</h2>
            </div>
          )}
          
          {loading && (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-warning text-center">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="row justify-content-center">
              {productos.length === 0 ? (
                <div className="col-12 text-center">
                  <p>No hay productos destacados disponibles.</p>
                </div>
              ) : (
                productos.map((p, index) => {
                  console.log(`Renderizando producto ${index + 1}:`, p.NombreProducto);
                  return (
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
                        {p.totalVendido && (
                          <small className="text-muted d-block mb-2">
                            Vendidos: {p.totalVendido}
                          </small>
                        )}
                        {!isAdmin && (
                          <DetalleButton
                            to={`/detalle/${p.ProductoID}`}
                            label="Ver Detalle"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}

          <div className="row mt-4">
            <div className="col d-flex justify-content-center">
              <a href="/tienda" className="btn btn-secondary ver-todo-btn">
                VER TODO
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de gestión del carrusel */}
      <CarruselModal 
        isOpen={showCarruselModal}
        onClose={() => setShowCarruselModal(false)}
        carruselItems={banners}
        onUpdate={handleUpdate}
      />

      <Footer />
    </div>
  );
}