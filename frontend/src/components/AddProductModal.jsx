import React, { useState, useEffect } from 'react';
import { createProductRequest, getProductsRequest } from '../api/productApi';
import { getTallasRequest, createTallaRequest } from '../api/tallaApi';
import { createProductTallaRequest } from '../api/productTallaApi';
import Swal from 'sweetalert2';
import './AddProductModal.css';

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const [formData, setFormData] = useState({
    NombreProducto: '',
    Descripcion: '',
    Precio: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTallas, setSelectedTallas] = useState({});
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewTallaInput, setShowNewTallaInput] = useState(false);
  const [newTallaNombre, setNewTallaNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTallas();
    }
  }, [isOpen]);

  const loadTallas = async () => {
    try {
      const tallasData = await getTallasRequest();
      setTallas(tallasData);
      
      // Inicializar selectedTallas con las tallas existentes
      const initialSelectedTallas = {};
      tallasData.forEach(talla => {
        initialSelectedTallas[talla.NombreTalla] = { selected: false, cantidad: 0 };
      });
      setSelectedTallas(initialSelectedTallas);
    } catch (error) {
      console.error('Error cargando tallas:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  const handleTallaChange = (talla, checked) => {
    setSelectedTallas(prev => ({
      ...prev,
      [talla]: {
        ...prev[talla],
        selected: checked,
        cantidad: checked ? prev[talla].cantidad : 0
      }
    }));
  };

  const handleCantidadChange = (talla, cantidad) => {
    setSelectedTallas(prev => ({
      ...prev,
      [talla]: {
        ...prev[talla],
        cantidad: parseInt(cantidad) || 0
      }
    }));
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
    const existingTalla = tallas.find(t => 
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
      setLoading(true);
      const newTalla = await createTallaRequest({ 
        NombreTalla: newTallaNombre.trim() 
      });
      
      // Recargar las tallas
      await loadTallas();
      
      // Agregar la nueva talla a las seleccionadas
      setSelectedTallas(prev => ({
        ...prev,
        [newTallaNombre.trim()]: { selected: true, cantidad: 0 }
      }));
      
      // Limpiar el input y ocultarlo
      setNewTallaNombre('');
      setShowNewTallaInput(false);
      
    } catch (error) {
      console.error('Error creando talla:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTalla = () => {
    setNewTallaNombre('');
    setShowNewTallaInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.NombreProducto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'El nombre del producto es requerido',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    if (!formData.Descripcion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo Requerido',
        text: 'La descripción es requerida',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    if (!formData.Precio || parseFloat(formData.Precio) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio Inválido',
        text: 'El precio debe ser mayor a 0',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    if (!selectedImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen Requerida',
        text: 'Debe seleccionar una imagen para el producto',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const hasSelectedTallas = Object.values(selectedTallas).some(talla => talla.selected);
    if (!hasSelectedTallas) {
      Swal.fire({
        icon: 'warning',
        title: 'Tallas Requeridas',
        text: 'Debe seleccionar al menos una talla para el producto',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const hasValidCantidades = Object.values(selectedTallas).some(talla => 
      talla.selected && talla.cantidad > 0
    );
    if (!hasValidCantidades) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidades Requeridas',
        text: 'Debe especificar cantidades mayores a 0 para las tallas seleccionadas',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Iniciando creación de producto...');
      
      // Crear FormData para el producto
      const productFormData = new FormData();
      productFormData.append('NombreProducto', formData.NombreProducto);
      productFormData.append('Descripcion', formData.Descripcion);
      productFormData.append('Precio', formData.Precio);
      productFormData.append('Imagen', selectedImage);

      console.log('📦 Creando producto...');
      // Crear el producto
      const newProduct = await createProductRequest(productFormData);
      console.log('✅ Producto creado:', newProduct);

      // Crear las relaciones producto-talla con stock
      let tallasCreadas = 0;
      let tallasFallidas = 0;
      
      console.log('👕 Creando relaciones producto-talla...');
      for (const [tallaNombre, tallaData] of Object.entries(selectedTallas)) {
        if (tallaData.selected && tallaData.cantidad > 0) {
          const talla = tallas.find(t => t.NombreTalla === tallaNombre);
          
          if (talla) {
            const tallaRequest = {
              ProductoID: newProduct.ProductoID,
              TallaID: talla.TallaID,
              Stock: tallaData.cantidad
            };
            
            console.log(`📝 Creando talla ${tallaNombre}:`, tallaRequest);
            
            try {
              await createProductTallaRequest(tallaRequest);
              console.log(`✅ Talla ${tallaNombre} creada exitosamente`);
              tallasCreadas++;
            } catch (error) {
              console.error(`❌ Error creando talla ${tallaNombre}:`, error);
              tallasFallidas++;
            }
          } else {
            console.error(`❌ No se encontró la talla ${tallaNombre}`);
            tallasFallidas++;
          }
        }
      }

      console.log(`📊 Resumen: ${tallasCreadas} tallas creadas, ${tallasFallidas} fallidas`);

      // Mostrar mensaje de éxito simple
      Swal.fire({
        icon: 'success',
        title: 'Producto creado',
        confirmButtonText: 'OK'
      });

      // Limpiar formulario
      setFormData({
        NombreProducto: '',
        Descripcion: '',
        Precio: ''
      });
      setSelectedImage(null);
      // Limpiar selectedTallas dinámicamente
      const clearedTallas = {};
      Object.keys(selectedTallas).forEach(talla => {
        clearedTallas[talla] = { selected: false, cantidad: 0 };
      });
      setSelectedTallas(clearedTallas);
      
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al Crear Producto',
        text: error.message || 'Ha ocurrido un error inesperado al crear el producto. Por favor, intenta nuevamente.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Producto</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="product-form">
          {/* Columna izquierda - Información del producto */}
          <div className="product-section">
            <div className="form-group">
              <label htmlFor="NombreProducto">Nombre del Producto *</label>
              <input
                type="text"
                id="NombreProducto"
                name="NombreProducto"
                value={formData.NombreProducto}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="Descripcion">Descripción *</label>
              <textarea
                id="Descripcion"
                name="Descripcion"
                value={formData.Descripcion}
                onChange={handleInputChange}
                rows="3"
                required
              />
            </div>

                         <div className="form-group">
               <label htmlFor="Precio">Precio *</label>
               <input
                 type="number"
                 id="Precio"
                 name="Precio"
                 value={formData.Precio}
                 onChange={handleInputChange}
                 min="0"
                 step="0.01"
                 required
               />
             </div>
          </div>

                     {/* Columna derecha - Tallas, cantidades e imagen */}
           <div className="tallas-section">
             <div className="form-group">
               <label htmlFor="Imagen">Imagen del Producto *</label>
               <input
                 type="file"
                 id="Imagen"
                 name="Imagen"
                 onChange={handleImageChange}
                 accept="image/*"
                 required
               />
             </div>

             <div className="form-group">
               <label>Tallas y Cantidades *</label>
               <div className="tallas-grid">
                 {Object.entries(selectedTallas).map(([talla, data]) => (
                   <div key={talla} className="talla-item">
                     <div className="talla-checkbox">
                       <input
                         type="checkbox"
                         id={`talla-${talla}`}
                         checked={data.selected}
                         onChange={(e) => handleTallaChange(talla, e.target.checked)}
                       />
                       <label htmlFor={`talla-${talla}`}>{talla}</label>
                     </div>
                     {data.selected && (
                       <input
                         type="number"
                         placeholder="Cantidad"
                         value={data.cantidad}
                         onChange={(e) => handleCantidadChange(talla, e.target.value)}
                         min="1"
                         max="999999"
                         className="cantidad-input"
                       />
                     )}
                   </div>
                 ))}
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
                       disabled={loading}
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
           </div>

          {/* Botones centrados en la parte inferior */}
          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-crear" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal; 