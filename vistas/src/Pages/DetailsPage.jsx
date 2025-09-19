// src/Pages/DetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../PagesCss/Detail.css";
import { getProductByIdRequest, updateProductRequest } from "../api/productApi";
import { getTallasRequest, createTallaRequest } from "../api/tallaApi";
import { getProductTallasRequest, createProductTallaRequest, updateProductTallaRequest, deleteProductTallaRequest } from "../api/productTallaApi";
import { useCart } from "../context/cartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Footer from "../components/Footer.jsx";
import CustomImage from "../components/CustomImage.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Swal from 'sweetalert2';

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
  const location = useLocation();
  const { addToCart, checkStock, formatPrice, clearError } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  // Verificar si debe entrar en modo de edición automáticamente
  const shouldEdit = location.search.includes('edit=true') && isAuthenticated && user && user.Rol === 'Admin';
  
  // Si no es admin pero tiene el parámetro edit, redirigir a la página normal
  useEffect(() => {
    if (location.search.includes('edit=true') && (!isAuthenticated || !user || user.Rol !== 'Admin')) {
      navigate(`/detalle/${id}`, { replace: true });
    }
  }, [location.search, isAuthenticated, user, navigate, id]);

  const [producto, setProducto] = useState(null);
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState("");
  const [stockDisponible, setStockDisponible] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  
  // Estados para modo de edición
  const [isEditing, setIsEditing] = useState(shouldEdit);
  const [editData, setEditData] = useState({
    NombreProducto: "",
    Descripcion: "",
    Precio: "",
    Imagen: null
  });
  const [allTallas, setAllTallas] = useState([]);
  const [productTallas, setProductTallas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showNewTallaInput, setShowNewTallaInput] = useState(false);
  const [newTallaNombre, setNewTallaNombre] = useState('');

  // Limpiar errores del contexto cuando se carga la página
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    (async () => {
      try {
        const prod = await getProductByIdRequest(id);
        setProducto(prod);
        
        // Obtener solo las tallas que tienen stock para este producto
        const allTallasData = await getTallasRequest();
        const tallasConStock = [];
        
        // Verificar stock para cada talla
        for (const talla of allTallasData) {
          const stock = await checkStock(id, talla.TallaID);
          if (stock > 0) {
            tallasConStock.push(talla);
          }
        }
        
        setTallas(tallasConStock);
        setAllTallas(allTallasData);
        
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

  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && producto) {
      setEditData({
        NombreProducto: producto.NombreProducto,
        Descripcion: producto.Descripcion || "",
        Precio: producto.Precio.toString(),
        Imagen: null
      });
      
      // Cargar tallas del producto
      loadProductTallas();
    }
  }, [isEditing, producto]);

  const loadProductTallas = async () => {
    try {
      const tallas = await getProductTallasRequest(id);
      setProductTallas(tallas);
    } catch (error) {
      console.error('Error cargando tallas del producto:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      NombreProducto: "",
      Descripcion: "",
      Precio: "",
      Imagen: null
    });
    // Redirigir a la tienda al cancelar
    navigate('/tienda');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData(prev => ({
        ...prev,
        Imagen: file
      }));
    }
  };

  const handleTallaChange = (tallaId, checked) => {
    setProductTallas(prev => {
      if (checked) {
        // Agregar talla si no existe
        const exists = prev.find(pt => pt.TallaID === tallaId);
        if (!exists) {
          return [...prev, { TallaID: tallaId, Stock: 0 }];
        }
      } else {
        // Remover talla
        return prev.filter(pt => pt.TallaID !== tallaId);
      }
      return prev;
    });
  };

  const handleStockChange = (tallaId, value) => {
    setProductTallas(prev => 
      prev.map(pt => 
        pt.TallaID === tallaId 
          ? { ...pt, Stock: parseInt(value) || 0 }
          : pt
      )
    );
  };

  const handleCreateNewTalla = async () => {
    if (!newTallaNombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor ingresa un nombre para la talla'
      });
      return;
    }

    // Verificar si ya existe una talla con ese nombre
    const existingTalla = allTallas.find(t => 
      t.NombreTalla.toLowerCase() === newTallaNombre.trim().toLowerCase()
    );

    if (existingTalla) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una talla con ese nombre'
      });
      return;
    }

    try {
      setSaving(true);
      const newTalla = await createTallaRequest({ 
        NombreTalla: newTallaNombre.trim() 
      });
      
      // Recargar las tallas
      const tallasData = await getTallasRequest();
      setAllTallas(tallasData);
      
      // Agregar la nueva talla a las seleccionadas del producto
      const createdTalla = tallasData.find(t => 
        t.NombreTalla.toLowerCase() === newTallaNombre.trim().toLowerCase()
      );
      
      if (createdTalla) {
        setProductTallas(prev => [...prev, { TallaID: createdTalla.TallaID, Stock: 0 }]);
      }
      
      // Limpiar el input y ocultarlo
      setNewTallaNombre('');
      setShowNewTallaInput(false);
      
    } catch (error) {
      console.error('Error creando talla:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNewTalla = () => {
    setNewTallaNombre('');
    setShowNewTallaInput(false);
  };

  const handleSaveProduct = async () => {
    if (!editData.NombreProducto.trim() || !editData.Precio) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    // Verificar si realmente hay cambios
    const hasChanges = 
      editData.NombreProducto !== producto.NombreProducto ||
      editData.Descripcion !== (producto.Descripcion || "") ||
      parseFloat(editData.Precio) !== parseFloat(producto.Precio) ||
      editData.Imagen !== null;

    // Verificar cambios en tallas
    const originalTallas = await getProductTallasRequest(id);
    const hasTallaChanges = productTallas.length !== originalTallas.length ||
      productTallas.some(pt => {
        const original = originalTallas.find(ot => ot.TallaID === pt.TallaID);
        return !original || original.Stock !== pt.Stock;
      });

    if (!hasChanges && !hasTallaChanges) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se han realizado cambios en el producto'
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('NombreProducto', editData.NombreProducto);
      formData.append('Descripcion', editData.Descripcion);
      formData.append('Precio', editData.Precio);
      if (editData.Imagen) {
        formData.append('Imagen', editData.Imagen);
      }

      await updateProductRequest(id, formData);

      // Actualizar tallas del producto
      const currentTallas = await getProductTallasRequest(id);
      
      // Eliminar tallas que ya no están seleccionadas
      for (const currentTalla of currentTallas) {
        const shouldKeep = productTallas.find(pt => pt.TallaID === currentTalla.TallaID);
        if (!shouldKeep) {
          await deleteProductTallaRequest(id, currentTalla.TallaID);
        }
      }

      // Crear o actualizar tallas seleccionadas
      for (const productTalla of productTallas) {
        const existing = currentTallas.find(ct => ct.TallaID === productTalla.TallaID);
        if (!existing) {
          // Crear nueva talla
          await createProductTallaRequest({
            ProductoID: parseInt(id),
            TallaID: productTalla.TallaID,
            Stock: productTalla.Stock
          });
        } else {
          // Actualizar talla existente
          await updateProductTallaRequest(id, productTalla.TallaID, { Stock: productTalla.Stock });
        }
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Producto actualizado correctamente'
      });

      // Redirigir a la tienda después de guardar
      navigate('/tienda');
    } catch (error) {
      console.error('Error guardando producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al guardar el producto'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setSnackbarMsg("¡Inicia sesión para agregar productos a tu carrito!");
      setSnackbarType("info");
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    if (cantidad > stockDisponible) {
      setSnackbarMsg(`Stock insuficiente. Disponible: ${stockDisponible}`);
      setSnackbarType("error");
      setSnackbarOpen(true);
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
      setSnackbarMsg("¡Producto agregado al carrito!");
      setSnackbarType("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg(err.message);
      setSnackbarType("error");
      setSnackbarOpen(true);
      setError("");
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
            {isEditing ? (
              <div className="image-edit-container">
                <CustomImage
                  folder="productos"
                  filename={producto.Imagen}
                  alt={producto.NombreProducto}
                  className="product-image"
                />
                <div className="image-upload-overlay">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="upload-button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Cambiar Imagen
                  </label>
                </div>
              </div>
            ) : (
              <CustomImage
                folder="productos"
                filename={producto.Imagen}
                alt={producto.NombreProducto}
                className="product-image"
              />
            )}
          </div>
          <div className="product-info-section">
            {isEditing ? (
              // Modo de edición
              <>
                <div className="edit-form">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre del Producto:</label>
                    <input
                      type="text"
                      id="nombre"
                      name="NombreProducto"
                      value={editData.NombreProducto}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="precio">Precio:</label>
                    <input
                      type="number"
                      id="precio"
                      name="Precio"
                      value={editData.Precio}
                      onChange={handleInputChange}
                      className="edit-input"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="descripcion">Descripción:</label>
                    <textarea
                      id="descripcion"
                      name="Descripcion"
                      value={editData.Descripcion}
                      onChange={handleInputChange}
                      className="edit-textarea"
                      rows="4"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tallas y Stock:</label>
                    <div className="tallas-grid">
                      {allTallas.map(talla => {
                        const productTalla = productTallas.find(pt => pt.TallaID === talla.TallaID);
                        const isSelected = productTalla !== undefined;
                        
                        return (
                          <div key={talla.TallaID} className="talla-item">
                            <label className="talla-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleTallaChange(talla.TallaID, e.target.checked)}
                              />
                              <span>{talla.NombreTalla}</span>
                            </label>
                            {isSelected && (
                              <input
                                type="number"
                                value={productTalla.Stock}
                                onChange={(e) => handleStockChange(talla.TallaID, e.target.value)}
                                className="stock-input"
                                min="0"
                                max="999999"
                                placeholder="Stock"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Sección para agregar nueva talla */}
                    <div className="new-talla-section">
                      {!showNewTallaInput ? (
                        <button
                          type="button"
                          className="btn-add-talla"
                          onClick={() => setShowNewTallaInput(true)}
                        >
                          + Agregar Nueva Talla
                        </button>
                      ) : (
                        <div className="new-talla-input-group">
                          <input
                            type="text"
                            placeholder="Nombre de la nueva talla (ej: XXL, 2XL)"
                            value={newTallaNombre}
                            onChange={(e) => setNewTallaNombre(e.target.value)}
                            className="new-talla-input"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateNewTalla();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-save-talla"
                            onClick={handleCreateNewTalla}
                            disabled={saving}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-talla"
                            onClick={handleCancelNewTalla}
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="edit-actions">
                    <button
                      className="save-button"
                      onClick={handleSaveProduct}
                      disabled={saving}
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button
                      className="cancel-button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Modo de visualización
              <>
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
                                 <div className="product-actions">
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
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <Snackbar 
        open={snackbarOpen} 
        message={snackbarMsg} 
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)} 
      />
    </>
  );
}