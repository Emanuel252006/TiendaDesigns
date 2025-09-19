// src/Pages/StorePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../PagesCss/StorePages.css";
import { getProductsRequest, deleteProductRequest } from "../api/productApi";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";
import AddProductModal from "../components/AddProductModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Swal from 'sweetalert2';

export default function StorePage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Obtener el término de búsqueda de la URL
  const params = new URLSearchParams(location.search);
  const busqueda = params.get("busqueda")?.toLowerCase() || "";

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtrar productos según la búsqueda
  const productosFiltrados = busqueda
    ? productos.filter(p =>
        p.NombreProducto.toLowerCase().includes(busqueda) ||
        (p.Descripcion && p.Descripcion.toLowerCase().includes(busqueda))
      )
    : productos;

  const loadProducts = () => {
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
  };

  const handleProductAdded = () => {
    loadProducts();
  };

  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteProductRequest(productId);
        loadProducts(); // Recargar la lista
      } catch (error) {
        console.error('Error eliminando producto:', error);
      }
    }
  };

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
              {productosFiltrados.length} productos disponibles
            </div>
            {/* Botón Agregar Producto solo para Admin */}
            {isAuthenticated && user && user.Rol === 'Admin' && (
              <button 
                className="btn-agregar-producto"
                onClick={() => setShowAddModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Agregar Producto
              </button>
            )}
          </div>

          {/* Grid de productos */}
          <div className="products-grid">
            {productosFiltrados.map((producto) => (
              <div key={producto.ProductoID} className="product-card">
                <div className="product-image-container">
                  <CustomImage
                    folder="productos"
                    filename={producto.Imagen}
                    alt={producto.NombreProducto}
                    className="product-image"
                  />
                                     <div className="product-overlay">
                     {isAuthenticated && user && user.Rol === 'Admin' ? (
                       <>
                         <button
                           className="overlay-button"
                           onClick={() => navigate(`/detalle/${producto.ProductoID}?edit=true`)}
                         >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                             <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                           </svg>
                           Editar
                         </button>
                         <button
                           className="overlay-button delete-button"
                           onClick={() => handleDeleteProduct(producto.ProductoID)}
                           title="Eliminar Producto"
                         >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <polyline points="3,6 5,6 21,6"></polyline>
                             <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                             <line x1="10" y1="11" x2="10" y2="17"></line>
                             <line x1="14" y1="11" x2="14" y2="17"></line>
                           </svg>
                           Eliminar
                         </button>
                       </>
                     ) : (
                       <DetalleButton
                         to={`/detalle/${producto.ProductoID}`}
                         label="Ver Detalle"
                         className="overlay-button"
                       />
                     )}
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
          {productosFiltrados.length === 0 && (
            <div className="no-products">
              <h3>No hay productos disponibles</h3>
              <p>Pronto tendremos nuevas colecciones para ti</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
      
      {/* Modal para agregar producto */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}