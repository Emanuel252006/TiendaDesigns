// src/pages/DetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import '../PagesCss/Detail.css';
import { getProductByIdRequest }        from '../api/productApi';
import { getTallasRequest }            from '../api/tallaApi';
import Footer                           from '../components/Footer.jsx';

// Función para formatear moneda COP con separador de miles y 2 decimales
const formatPrice = value =>
  new Intl.NumberFormat('es-CO', {
    style:              'currency',
    currency:           'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

export default function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto,       setProducto]    = useState(null);
  const [tallas,         setTallas]      = useState([]);
  const [loading,        setLoading]     = useState(true);
  const [cantidad,       setCantidad]    = useState(1);
  const [selectedTalla,  setSelectedTalla] = useState('');

  const handleDecrease = () =>
    setCantidad(c => Math.max(1, c - 1));
  const handleIncrease = () =>
    setCantidad(c => c + 1);
  const handleTallaChange = e => {
    setSelectedTalla(e.target.value);
    setCantidad(1);
  };

  useEffect(() => {
    (async () => {
      try {
        const prod = await getProductByIdRequest(id);
        setProducto(prod);
        const allTallas = await getTallasRequest();
        setTallas(allTallas);
        if (allTallas.length > 0) {
          setSelectedTalla(allTallas[0].TallaID.toString());
        }
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <p className="text-center mt-5">Cargando detalles…</p>;
  if (!producto) return null;

  return (
    <>
      <div className="product-page-wrapper">
        <div className="main-content">
          {/* Imagen */}
          <div className="product-image-section">
            <img
              src={
                producto.Imagen
                  ? `http://localhost:5001${producto.Imagen}`
                  : '/images/default.png'
              }
              alt={producto.NombreProducto}
              className="product-image"
              onError={e => (e.target.src = '/images/default.png')}
            />
          </div>

          {/* Información */}
          <div className="product-info-section">
            <h2 className="product-title">
              {producto.NombreProducto}
            </h2>

            {/* Aquí usamos formatPrice */}
            <p className="product-price">
              {formatPrice(parseFloat(producto.Precio))}
            </p>

            <p className="product-description">
              {producto.Descripcion || 'Sin descripción.'}
            </p>

            {/* Selector de tallas */}
            <div className="product-options">
              <label htmlFor="talla-select">Talla:</label>
              <select
                id="talla-select"
                value={selectedTalla}
                onChange={handleTallaChange}
              >
                {tallas.map(t => (
                  <option key={t.TallaID} value={t.TallaID.toString()}>
                    {t.NombreTalla}
                  </option>
                ))}
              </select>
            </div>

            {/* Contador de cantidad */}
            <div className="product-quantity">
              <label>Cantidad:</label>
              <div className="quantity-control">
                <button
                  onClick={handleDecrease}
                  disabled={cantidad <= 1}
                  className="quantity-btn"
                >−</button>
                <input
                  type="text"
                  readOnly
                  value={cantidad}
                  className="quantity-input"
                />
                <button
                  onClick={handleIncrease}
                  className="quantity-btn"
                >+</button>
              </div>
            </div>

            <button className="add-to-cart-button">
              Añadir {cantidad} al carrito
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}