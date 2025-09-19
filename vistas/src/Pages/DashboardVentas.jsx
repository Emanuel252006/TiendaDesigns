import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { checkoutApi } from '../api/checkoutApi.js';
import Navigation from '../components/navegation.jsx';
import { 
  FaChartBar, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaCalendarDay, 
  FaCalendarWeek, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCreditCard
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../PagesCss/DashboardVentas.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardVentas = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar si es admin
  const isAdmin = user && user.Rol === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      loadSalesStats();
      
      // Actualizar automáticamente cada 30 segundos
      const interval = setInterval(() => {
        loadSalesStats();
      }, 30000);
      
      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const loadSalesStats = async () => {
    try {
      setLoading(true);
      const response = await checkoutApi.getSalesStats();
      console.log('Respuesta completa de getSalesStats:', response);
      if (response.success) {
        console.log('Datos de estadísticas:', response.data);
        setStats(response.data);
      } else {
        console.log('Error en respuesta:', response);
        setError('Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('es-CO').format(num);
  };

  // Función para obtener el color del día de la semana
  const getDayColor = (day) => {
    const colors = {
      'Monday': '#FF6B6B',
      'Tuesday': '#4ECDC4',
      'Wednesday': '#45B7D1',
      'Thursday': '#96CEB4',
      'Friday': '#FFEAA7',
      'Saturday': '#DDA0DD',
      'Sunday': '#FFB6C1'
    };
    return colors[day] || '#6C5CE7';
  };

  // Función para traducir días de la semana
  const translateDay = (day) => {
    const translations = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo'
    };
    return translations[day] || day;
  };

  // Configuración para gráfico de métodos de pago (Pie Chart)
  const paymentMethodsChartData = {
    labels: stats?.paymentMethods?.map(method => method.MetodoPago) || [],
    datasets: [
      {
        data: stats?.paymentMethods?.map(method => method.Cantidad) || [],
        backgroundColor: [
          '#4CAF50', // Verde para MercadoPago
          '#2196F3', // Azul para otros métodos
          '#FF9800', // Naranja para pendientes
          '#9C27B0', // Púrpura
          '#F44336', // Rojo
        ],
        borderColor: [
          '#388E3C',
          '#1976D2',
          '#F57C00',
          '#7B1FA2',
          '#D32F2F',
        ],
        borderWidth: 2,
      },
    ],
  };

  const paymentMethodsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} ventas (${percentage}%)`;
          }
        }
      }
    }
  };

  // Configuración para gráfico de ciudades (Pie Chart)
  const citiesChartData = {
    labels: stats?.topCities?.slice(0, 5).map(city => city.Ciudad) || [],
    datasets: [
      {
        data: stats?.topCities?.slice(0, 5).map(city => city.CantidadCompras) || [],
        backgroundColor: [
          '#E91E63', // Rosa
          '#9C27B0', // Púrpura
          '#3F51B5', // Azul índigo
          '#009688', // Verde azulado
          '#FF5722', // Rojo anaranjado
        ],
        borderColor: [
          '#C2185B',
          '#7B1FA2',
          '#303F9F',
          '#00695C',
          '#D84315',
        ],
        borderWidth: 2,
      },
    ],
  };

  const citiesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} compras (${percentage}%)`;
          }
        }
      }
    }
  };

  // Configuración para gráfico de ventas por día (Bar Chart)
  const salesByDayChartData = {
    labels: stats?.salesByDay?.map(day => translateDay(day.DiaSemana)) || [],
    datasets: [
      {
        label: '',
        data: stats?.salesByDay?.map(day => parseFloat(day.TotalVentas) || 0) || [],
        backgroundColor: [
          '#FF6B6B', // Lunes
          '#4ECDC4', // Martes
          '#45B7D1', // Miércoles
          '#96CEB4', // Jueves
          '#FFEAA7', // Viernes
          '#DDA0DD', // Sábado
          '#FFB6C1', // Domingo
        ],
        borderColor: [
          '#FF5252',
          '#26C6DA',
          '#29B6F6',
          '#66BB6A',
          '#FFCA28',
          '#BA68C8',
          '#F48FB1',
        ],
        borderWidth: 2,
      },
    ],
  };

  const salesByDayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const day = context.label;
            const montoVentas = context.parsed.y;
            const dayData = stats?.salesByDay?.find(d => translateDay(d.DiaSemana) === day);
            const cantidadVentas = dayData ? dayData.CantidadVentas : 0;
            return `${day}: ${formatPrice(montoVentas)} (${cantidadVentas} órdenes)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatPrice(value);
          }
        }
      },
      x: {
        title: {
          display: false
        }
      }
    }
  };

  if (!isAdmin) {
    return (
      <>
        <Navigation />
        <div className="container mt-5 pt-5">
          <div className="alert alert-danger">
            <h4>Acceso Denegado</h4>
            <p>Solo los administradores pueden acceder a esta página.</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mt-5 pt-5">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3">Cargando estadísticas de ventas...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="container mt-5 pt-5">
          <div className="alert alert-danger">
            <h4>Error</h4>
            <p>{error}</p>
            <button className="btn btn-outline-danger" onClick={loadSalesStats}>
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  // Verificar si hay datos de ventas
  const hasData = stats && (
    (stats.periodStats && stats.periodStats.totalOrdenes > 0) ||
    (stats.paymentMethods && stats.paymentMethods.length > 0) ||
    (stats.topProducts && stats.topProducts.length > 0)
  );

  if (!loading && !hasData) {
    return (
      <>
        <Navigation />
        <div className="container mt-5 pt-5">
          <div className="text-center py-5">
            <div className="empty-state">
              <FaChartBar size={80} className="text-muted mb-4" />
              <h2 className="text-muted">No hay datos de ventas</h2>
              <p className="text-muted mb-4">
                Aún no se han registrado ventas en tu tienda. 
                Las estadísticas aparecerán aquí una vez que tengas órdenes con pagos confirmados.
              </p>
              <div className="alert alert-info">
                <h5>💡 Para ver datos aquí necesitas:</h5>
                <ul className="text-start">
                  <li>Órdenes creadas por clientes</li>
                  <li>Pagos procesados (con MercadoPago u otros métodos)</li>
                  <li>Productos vendidos</li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={loadSalesStats}>
                <i className="fas fa-sync-alt me-2"></i>
                Actualizar Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-ventas">
      <div className="container">
          <div className="dashboard-header">
            <h1><FaChartBar /> Dashboard de Ventas</h1>
            <p className="text-muted">Estadísticas y métricas de ventas en tiempo real</p>
            {stats?.currentPeriod && (
              <div className="period-info">
                <h4>{stats.currentPeriod.MesActual} {stats.currentPeriod.AnoActual}</h4>
                <p className="text-muted">
                  Semana actual: {new Date(stats.currentPeriod.InicioSemana).toLocaleDateString()} - {new Date(stats.currentPeriod.FinSemana).toLocaleDateString()}
                </p>
              </div>
            )}
            <p className="auto-update-note">
              <small>Actualización automática cada 30 segundos</small>
            </p>
          </div>

          {/* Métricas principales */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <FaCalendarDay />
              </div>
              <div className="metric-content">
                <h3>{formatPrice(stats?.periodStats?.totalHoy || 0)}</h3>
                <p>Ventas Hoy</p>
                <span className="metric-quantity">{formatNumber(stats?.periodStats?.ventasHoy || 0)} órdenes</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FaCalendarWeek />
              </div>
              <div className="metric-content">
                <h3>{formatPrice(stats?.periodStats?.totalSemana || 0)}</h3>
                <p>Ventas Esta Semana</p>
                <span className="metric-quantity">{formatNumber(stats?.periodStats?.ventasSemana || 0)} órdenes</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FaCalendarAlt />
              </div>
              <div className="metric-content">
                <h3>{formatPrice(stats?.periodStats?.totalMes || 0)}</h3>
                <p>Ventas Este Mes</p>
                <span className="metric-quantity">{formatNumber(stats?.periodStats?.ventasMes || 0)} órdenes</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <FaMoneyBillWave />
              </div>
              <div className="metric-content">
                <h3>{formatPrice(stats?.periodStats?.totalGeneral || 0)}</h3>
                <p>Total General</p>
                <span className="metric-subtitle">Todas las ventas</span>
              </div>
            </div>
          </div>

          {/* Gráficos y estadísticas */}
          <div className="charts-grid">
            {/* Gráfico de métodos de pago */}
            <div className="chart-card">
              <h3><FaCreditCard /> Métodos de Pago Más Usados</h3>
              <div className="chart-container">
                {stats?.paymentMethods?.length > 0 ? (
                  <div className="chart-wrapper">
                    <Pie data={paymentMethodsChartData} options={paymentMethodsChartOptions} />
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de métodos de pago disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de ciudades */}
            <div className="chart-card">
              <h3><FaMapMarkerAlt /> Ciudades con Más Compras</h3>
              <div className="chart-container">
                {stats?.topCities?.length > 0 ? (
                  <div className="chart-wrapper">
                    <Pie data={citiesChartData} options={citiesChartOptions} />
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de ciudades disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de ventas por día de la semana */}
            <div className="chart-card full-width">
              <h3>
                <FaChartLine /> Ventas por Día de la Semana 
                {stats?.currentPeriod && (
                  <span className="period-subtitle">
                    ({stats.currentPeriod.MesActual} {stats.currentPeriod.AnoActual})
                  </span>
                )}
              </h3>
              <div className="chart-container">
                {stats?.salesByDay?.length > 0 ? (
                  <div className="chart-wrapper">
                    <Bar data={salesByDayChartData} options={salesByDayChartOptions} />
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de ventas por día disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="chart-card full-width">
              <h3><FaShoppingCart /> Productos Más Vendidos</h3>
              <div className="chart-container">
                {stats?.topProducts?.length > 0 ? (
                  <div className="products-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad Vendida</th>
                          <th>Total Generado</th>
                          <th>Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topProducts.map((product, index) => {
                          const totalRevenue = stats.topProducts.reduce((sum, p) => sum + p.TotalGenerado, 0);
                          const percentage = totalRevenue > 0 ? (product.TotalGenerado / totalRevenue) * 100 : 0;
                          
                          return (
                            <tr key={index}>
                              <td>
                                <div className="product-info">
                                  <span className="product-rank">#{index + 1}</span>
                                  <span className="product-name">{product.NombreProducto}</span>
                                </div>
                              </td>
                              <td>{formatNumber(product.CantidadVendida)} unidades</td>
                              <td>{formatPrice(product.TotalGenerado)}</td>
                              <td>
                                <div className="percentage-bar">
                                  <div 
                                    className="percentage-fill"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#4CAF50'
                                    }}
                                  ></div>
                                  <span className="percentage-text">{percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de productos disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </>
  );
};

export default DashboardVentas; 