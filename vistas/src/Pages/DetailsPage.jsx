// src/Pages/DetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../PagesCss/Detail.css";
import { getProductByIdRequest } from "../api/productApi";
import { getTallasRequest } from "../api/tallaApi";
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

  const [producto, setProducto] = useState(null);
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const prod = await getProductByIdRequest(id);
        setProducto(prod);
        const all = await getTallasRequest();
        setTallas(all);
        if (all.length) setSelectedTalla(all[0].TallaID.toString());
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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
            <div className="product-options">
              <label htmlFor="talla-select">Talla:</label>
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
                  className="quantity-btn"
                >
                  +
                </button>
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