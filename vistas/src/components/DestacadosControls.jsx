import React, { useState } from 'react';
import Swal from 'sweetalert2';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DestacadosControls = ({ onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('aleatorios'); // Estado para rastrear el tipo activo

  const handleCambiarTipoDestacados = async (tipo) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/products/destacados`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo })
      });

      if (response.ok) {
        const tipoText = tipo === 'aleatorios' ? 'aleatorios' : 
                        tipo === 'masVendidos' ? 'más vendidos' : 'manual';
        Swal.fire('Éxito', `Productos destacados cambiados a ${tipoText}`, 'success');
        setActiveType(tipo); // Actualizar el tipo activo
        onUpdate();
      } else {
        throw new Error('Error al cambiar tipo de destacados');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudo cambiar el tipo de productos destacados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarDestacados = async () => {
    Swal.fire('Info', 'Esta funcionalidad estará disponible próximamente', 'info');
  };

  return (
    <div className="destacados-controls mb-3">
      <div className="btn-group" role="group">
        <button 
          className={`btn btn-sm ${activeType === 'aleatorios' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => handleCambiarTipoDestacados('aleatorios')}
          disabled={loading}
        >
          Aleatorios
        </button>
        <button 
          className={`btn btn-sm ${activeType === 'masVendidos' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => handleCambiarTipoDestacados('masVendidos')}
          disabled={loading}
        >
          Más Vendidos
        </button>
        <button 
          className={`btn btn-sm ${activeType === 'manual' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={handleSeleccionarDestacados}
          disabled={loading}
        >
          Manual
        </button>
      </div>
      {loading && (
        <div className="d-inline-block ms-2">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestacadosControls; 