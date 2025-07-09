// src/Pages/DetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../PagesCss/Detail.css";
import { getProductByIdRequest } from "../api/productApi";
import { getTallasRequest } from "../api/tallaApi";
import { useCart } from "../context/cartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, checkStock, formatPrice } = useCart();
  const { isAuthenticated } = useAuth();

  const [producto, setProducto] = useState(null);
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState("");
  const [stockDisponible, setStockDisponible] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const prod = await getProductByIdRequest(id);
        setProducto(prod);
        
        // Obtener solo las tallas que tienen stock para este producto
        const allTallas = await getTallasRequest();
        const tallasConStock = [];
        
        // Verificar stock para cada talla
        for (const talla of allTallas) {
          const stock = await checkStock(id, talla.TallaID);
          if (stock > 0) {
            tallasConStock.push(talla);
          }
        }
        
        setTallas(tallasConStock);
        
        if (tallasConStock.length > 0) {
          setSelectedTalla(tallasConStock[0].TallaID.toString());
          const stock = await checkStock(id, tallasConStock[0].TallaID);
          setStockDisponible(stock);
        } else {
          setStockDisponible(0);
        }
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, checkStock]);

  // Verificar stock cuando cambia la talla
  useEffect(() => {
    if (selectedTalla && producto) {
      checkStock(producto.ProductoID, parseInt(selectedTalla)).then(setStockDisponible);
    }
  }, [selectedTalla, producto, checkStock]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (cantidad > stockDisponible) {
      setError(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }

    setAddingToCart(true);
    setError("");

    try {
      await addToCart({
        ProductoID: parseInt(id),
        TallaID: parseInt(selectedTalla),
        Cantidad: cantidad
      });
      
      // Mostrar mensaje de éxito
      alert("Producto agregado al carrito exitosamente");
      
      // Opcional: redirigir al carrito
      // navigate("/carrito");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <p className="text-center mt-5">Cargando…</p>;
  if (!producto) return null;

  return (
    <>
      <div className="product-page-wrapper">
        <div className="main-content">
          <div className="product-image-section">
            <CustomImage
              folder="productos"
              filename={producto.Imagen}
              alt={producto.NombreProducto}
              className="product-image"
            />
          </div>
          <div className="product-info-section">
            <h2 className="product-title">{producto.NombreProducto}</h2>
            <p className="product-price">
              {formatPrice(parseFloat(producto.Precio))}
            </p>
            <p className="product-description">
              {producto.Descripcion || "Sin descripción."}
            </p>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <div className="stock-info">
              <p>
                <strong>Stock disponible:</strong> {stockDisponible} unidades
              </p>
            </div>
            <div className="product-options">
              <label htmlFor="talla-select">Talla:</label>
              {tallas.length > 0 ? (
                <select
                  id="talla-select"
                  value={selectedTalla}
                  onChange={(e) => {
                    setSelectedTalla(e.target.value);
                    setCantidad(1);
                  }}
                >
                  {tallas.map((t) => (
                    <option key={t.TallaID} value={t.TallaID.toString()}>
                      {t.NombreTalla}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-danger">No hay tallas disponibles para este producto</p>
              )}
            </div>
            <div className="product-quantity">
              <label>Cantidad:</label>
              <div className="quantity-control">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  className="quantity-btn"
                >
                  −
                </button>
                <input
                  type="text"
                  readOnly
                  value={cantidad}
                  className="quantity-input"
                />
                <button
                  onClick={() => setCantidad((c) => c + 1)}
                  disabled={cantidad >= stockDisponible}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
            </div>
            <button 
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={addingToCart || stockDisponible === 0 || tallas.length === 0}
            >
              {addingToCart ? "Agregando..." : 
               stockDisponible === 0 || tallas.length === 0 ? "Sin stock disponible" : 
               `Añadir ${cantidad} al carrito`}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}