import React, { useState } from 'react';
import Swal from 'sweetalert2';
import CustomImage from './CustomImage.jsx';
import { API_PREFIX } from '../config/runtime.js';

const CarruselModal = ({ isOpen, onClose, carruselItems, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleAgregarCarrusel = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Agregar Imagen al Carrusel',
      html: `
        <div style="text-align: left; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
          <small><strong>💡 Tip:</strong> Al insertar una imagen en una posición, las demás se desplazarán automáticamente. Por ejemplo, si insertas en posición 1, la imagen que estaba en 1 pasará a 2, y así sucesivamente.</small>
        </div>
        <input id="swal-input1" class="swal2-input" placeholder="Seleccionar imagen" type="file" accept="image/*">
        <input id="swal-input2" class="swal2-input" placeholder="Posición en el carrusel (1, 2, 3...)" type="number" min="1">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const imagen = document.getElementById('swal-input1').files[0];
        const orden = document.getElementById('swal-input2').value;
        if (!imagen || !orden) {
          Swal.showValidationMessage('Por favor completa todos los campos');
          return false;
        }
        return { imagen, orden: parseInt(orden) };
      }
    });

    if (formValues) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('imagen', formValues.imagen);
        formData.append('orden', formValues.orden);

        const response = await fetch(`${API_PREFIX}/carrusel`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          Swal.fire('Éxito', 'Imagen agregada al carrusel', 'success');
          onUpdate();
        } else {
          throw new Error('Error al agregar imagen');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo agregar la imagen', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditarCarrusel = async (item) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Imagen del Carrusel',
      html: `
        <div style="text-align: left; margin-bottom: 15px; padding: 10px; background: #e7f3ff; border-radius: 5px;">
          <small><strong>🔄 Reordenar:</strong> Si cambias la posición, las otras imágenes se reorganizarán automáticamente para mantener el orden consecutivo.</small>
        </div>
        <input id="swal-input1" class="swal2-input" placeholder="Nueva imagen (opcional)" type="file" accept="image/*">
        <input id="swal-input2" class="swal2-input" placeholder="Nueva posición" type="number" min="1" value="${item.Orden}">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const imagen = document.getElementById('swal-input1').files[0];
        const orden = document.getElementById('swal-input2').value;
        if (!orden) {
          Swal.showValidationMessage('Por favor ingresa el orden');
          return false;
        }
        return { imagen, orden: parseInt(orden) };
      }
    });

    if (formValues) {
      setLoading(true);
      try {
        const formData = new FormData();
        if (formValues.imagen) {
          formData.append('imagen', formValues.imagen);
        }
        formData.append('orden', formValues.orden);

        const response = await fetch(`${API_PREFIX}/carrusel/${item.CarruselID}`, {
          method: 'PUT',
          body: formData
        });

        if (response.ok) {
          Swal.fire('Éxito', 'Imagen actualizada', 'success');
          onUpdate();
        } else {
          throw new Error('Error al actualizar imagen');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo actualizar la imagen', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEliminarCarrusel = async (item) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await fetch(`${API_PREFIX}/carrusel/${item.CarruselID}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          Swal.fire('Eliminado', 'Imagen eliminada del carrusel', 'success');
          onUpdate();
        } else {
          throw new Error('Error al eliminar imagen');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo eliminar la imagen', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-images me-2"></i>
            Gestionar Carrusel
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Imágenes del Carrusel ({carruselItems.length})
            </h6>
            <button 
              className="btn btn-success btn-sm"
              onClick={handleAgregarCarrusel}
              disabled={loading}
            >
              <i className="fas fa-plus"></i> Agregar Nueva Imagen
            </button>
          </div>

          {loading && (
            <div className="text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          <div className="row">
            {carruselItems.map((item, index) => (
              <div key={item.CarruselID} className="col-md-4 col-lg-3 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="position-relative">
                    <CustomImage
                      folder="carrusel"
                      filename={item.ImagenPath}
                      alt={`Banner ${index + 1}`}
                      className="card-img-top"
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="badge bg-primary">Orden: {item.Orden}</span>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title text-center mb-3">
                      Imagen #{index + 1}
                    </h6>
                    <div className="mt-auto">
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditarCarrusel(item)}
                          disabled={loading}
                        >
                          <i className="fas fa-edit me-1"></i> Cambiar Imagen
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleEliminarCarrusel(item)}
                          disabled={loading}
                        >
                          <i className="fas fa-trash me-1"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {carruselItems.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-images fa-4x text-muted mb-3"></i>
              <h5 className="text-muted mb-3">No hay imágenes en el carrusel</h5>
              <p className="text-muted mb-4">Haz clic en "Agregar Nueva Imagen" para comenzar a gestionar el carrusel.</p>
              <button 
                className="btn btn-primary"
                onClick={handleAgregarCarrusel}
                disabled={loading}
              >
                <i className="fas fa-plus me-2"></i>Agregar Primera Imagen
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="d-flex justify-content-between align-items-center w-100">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Las imágenes se mostrarán en el carrusel según su orden
            </small>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <i className="fas fa-times me-1"></i>Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarruselModal; 