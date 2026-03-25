import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Navigation from '../components/navegation.jsx';
import { getStockPorTallasRequest, getProductosVendidosRequest, getEstadisticasProductosRequest } from '../api/productApi.js';
import '../PagesCss/DashboardProductos.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardProductos = () => {
  const [stockData, setStockData] = useState([]);
  const [ventasData, setVentasData] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);

  // Función para cargar datos
  const loadDashboardData = async () => {
    try {
      const [stockResponse, ventasResponse, statsResponse] = await Promise.all([
        getStockPorTallasRequest(),
        getProductosVendidosRequest(),
        getEstadisticasProductosRequest()
      ]);

      if (stockResponse.data?.success) {
        setStockData(stockResponse.data.data);
      }
      if (ventasResponse.data?.success) {
        setVentasData(ventasResponse.data.data);
      }
      if (statsResponse.data?.success) {
        setEstadisticas(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Actualización automática cada 10 segundos
  useEffect(() => {
    const intervalId = setInterval(loadDashboardData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Preparar datos para la gráfica de stock por tallas (Bar Chart con colores semáforo)
  const prepareStockChartData = () => {
    const productos = [...new Set(stockData.map(item => item.NombreProducto))];
    const tallas = [...new Set(stockData.map(item => item.NombreTalla))];
    
    const datasets = tallas.map(talla => {
      const data = productos.map(producto => {
        const item = stockData.find(s => s.NombreProducto === producto && s.NombreTalla === talla);
        return item ? item.Stock : 0;
      });

      // LÓGICA CORREGIDA: Cada barra individual debe tener su color basado en su propio stock
      // Crear un array de colores donde cada elemento corresponde a una barra específica
      const backgroundColors = data.map(stock => {
        if (stock === 0) return '#dc3545'; // 🔴 Rojo - Sin stock
        else if (stock <= 10) return '#ffc107'; // 🟡 Amarillo - Stock bajo
        else if (stock <= 20) return '#fd7e14'; // 🟠 Naranja - Stock medio
        else return '#28a745'; // 🟢 Verde - Stock alto
      });

      return {
        label: `Talla ${talla}`,
        data: data,
        backgroundColor: backgroundColors, // Array de colores individuales
        borderColor: backgroundColors, // Array de colores individuales
        borderWidth: 1
      };
    });

    return {
      labels: productos,
      datasets: datasets
    };
  };


  // Opciones para la gráfica de barras
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock por Producto y Talla',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const stock = context.parsed.y;
            let estado = '';
            if (stock === 0) estado = ' (Sin Stock)';
            else if (stock <= 10) estado = ' (Stock Bajo)';
            else if (stock <= 20) estado = ' (Stock Medio)';
            else estado = ' (Stock Alto)';
            return `${context.dataset.label}: ${stock}${estado}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad en Stock'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Productos'
        }
      }
    }
  };


  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container dashboard-main-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando dashboard de productos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
               <div className="container dashboard-main-content">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="dashboard-title">
              <i className="fas fa-chart-bar me-3"></i>
              Dashboard de Productos
            </h2>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card dashboard-card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Productos</h5>
                <h2 className="card-text">{estadisticas?.TotalProductos || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card dashboard-card bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Sin Stock</h5>
                <h2 className="card-text">{estadisticas?.ProductosSinStock || 0}</h2>
              </div>
            </div>
          </div>
                     <div className="col-md-2">
             <div className="card dashboard-card bg-warning text-white">
               <div className="card-body">
                 <h5 className="card-title">Stock Bajo</h5>
                 <h2 className="card-text">{estadisticas?.ProductosStockBajo || 0}</h2>
               </div>
             </div>
           </div>
           <div className="col-md-2">
             <div className="card dashboard-card" style={{backgroundColor: '#fd7e14'}}>
               <div className="card-body text-white">
                 <h5 className="card-title">Stock Medio</h5>
                 <h2 className="card-text">{estadisticas?.ProductosStockMedio || 0}</h2>
               </div>
             </div>
           </div>
           <div className="col-md-2">
             <div className="card dashboard-card bg-success text-white">
               <div className="card-body">
                 <h5 className="card-title">Stock Alto</h5>
                 <h2 className="card-text">{estadisticas?.ProductosStockAlto || 0}</h2>
               </div>
             </div>
           </div>
        </div>

        <div className="row">
          {/* Gráfica de stock por tallas - Ahora ocupa todo el ancho */}
          <div className="col-12 mb-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">Stock por Producto y Talla</h5>
                {stockData.length > 0 ? (
                  <div className="chart-container">
                    <Bar data={prepareStockChartData()} options={barChartOptions} />
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <p>No hay datos de stock disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Leyenda de colores */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <h6 className="card-title">Leyenda de Colores</h6>
                <div className="row">
                  <div className="col-12">
                    <h6>Stock por Tallas:</h6>
                    <div className="d-flex flex-wrap gap-3">
                      <div className="d-flex align-items-center">
                        <div className="color-box bg-danger me-2"></div>
                        <small>Sin Stock (0)</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="color-box bg-warning me-2"></div>
                        <small>Stock Bajo (1-10)</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="color-box" style={{backgroundColor: '#fd7e14'}}></div>
                        <small>Stock Medio (11-20)</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="color-box bg-success me-2"></div>
                        <small>Stock Alto (21+)</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardProductos; 