import React, { useState, useEffect } from 'react';
import Navigation from '../components/navegation.jsx';
import { 
  getUserStatisticsRequest, 
  getActiveCartUsersRequest, 
  getCountryDistributionRequest 
} from '../api/userApi.js';
import Swal from 'sweetalert2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import '../PagesCss/DashboardUsuarios.css';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardUsuarios = () => {
  const [stats, setStats] = useState(null);
  const [usersWithCarts, setUsersWithCarts] = useState([]);
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, cartsResponse, countryResponse] = await Promise.all([
          getUserStatisticsRequest(),
          getActiveCartUsersRequest(),
          getCountryDistributionRequest()
        ]);


        
        // Corregir acceso a los datos anidados
        if (statsResponse.data && statsResponse.data.success) {
          setStats(statsResponse.data.data);
        } else {
          setStats(statsResponse.data);
        }
        
        if (cartsResponse.data && cartsResponse.data.success) {
          setUsersWithCarts(cartsResponse.data.data);
        } else {
          setUsersWithCarts(cartsResponse.data);
        }
        
        if (countryResponse.data && countryResponse.data.success) {
          setCountryData(countryResponse.data.data);
        } else {
          setCountryData(countryResponse.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Actualización automática del dashboard cada 5 segundos
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        // Actualizar estadísticas
        const statsResponse = await getUserStatisticsRequest();
        if (statsResponse.data && statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }

        // Actualizar tabla de carritos activos
        const cartsResponse = await getActiveCartUsersRequest();
        if (cartsResponse.data && cartsResponse.data.success) {
          setUsersWithCarts(cartsResponse.data.data);
        }
      } catch (err) {
        console.error('Error actualizando dashboard:', err);
      }
    }, 5000); // Actualización cada 5 segundos

    return () => clearInterval(intervalId);
  }, []); // Sin dependencias para evitar loops


  // Configuración para el gráfico de países
  const pieChartData = countryData && countryData.length > 0 ? {
    labels: countryData.map(item => item.Pais),
    datasets: [
      {
        data: countryData.map(item => item.CantidadUsuarios),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : null;

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribución de Usuarios por País'
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container dashboard-main-content">
          <div className="d-flex justify-content-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <div className="container dashboard-main-content">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container dashboard-main-content">
        <div className="mb-4">
          <h2 className="dashboard-title">
            <i className="fas fa-users me-3"></i>
            Dashboard de Usuarios
          </h2>
        </div>
        
        {/* Tarjetas de estadísticas generales */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card dashboard-card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Total Usuarios</h5>
                <h2 className="card-text">{stats?.generalStats?.TotalUsuarios || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card dashboard-card bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Usuarios Activos</h5>
                <h2 className="card-text">{stats?.generalStats?.UsuariosActivos || 0}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card dashboard-card bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Esta Semana</h5>
                <h2 className="card-text">{stats?.generalStats?.UsuariosEstaSemana || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card dashboard-card bg-warning text-white">
              <div className="card-body">
                <h5 className="card-title">Este Mes</h5>
                <h2 className="card-text">{stats?.generalStats?.UsuariosEsteMes || 0}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Gráfico de distribución por países */}
          <div className="col-md-6 mb-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">Distribución por Países</h5>
                {pieChartData ? (
                  <div className="chart-container">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <p>No hay datos de distribución por países disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de usuarios con carritos activos */}
          <div className="col-md-6 mb-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">Usuarios con Carritos Activos</h5>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Items</th>
                        <th>Fecha Carrito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersWithCarts.length > 0 ? (
                        usersWithCarts.map((user, index) => (
                            <tr key={index}>
                              <td>{user.NombreUsuario}</td>
                              <td>{user.Correo}</td>
                              <td>
                                <span className="badge bg-primary">
                                  {user.ItemsEnCarrito}
                                </span>
                              </td>
                              <td>
                                {new Date(user.FechaCarrito).toLocaleDateString('es-ES')}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            No hay usuarios con carritos activos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="row">
          <div className="col-12">
            <div className="card dashboard-card summary-card">
              <div className="card-body">
                <h5 className="card-title">Resumen de Actividad</h5>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Usuarios con carritos activos:</strong> {usersWithCarts.length}</p>
                    <p><strong>Países con más usuarios:</strong> {countryData?.[0]?.Pais || 'N/A'} ({countryData?.[0]?.CantidadUsuarios || 0} usuarios)</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Promedio de items por carrito:</strong> {
                      usersWithCarts.length > 0 
                        ? (usersWithCarts.reduce((sum, user) => sum + user.ItemsEnCarrito, 0) / usersWithCarts.length).toFixed(1)
                        : 0
                    }</p>
                    <p><strong>Última actividad:</strong> {
                      usersWithCarts.length > 0 
                        ? new Date(usersWithCarts[0].FechaCarrito).toLocaleDateString('es-ES')
                        : 0
                    }</p>
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

export default DashboardUsuarios; 