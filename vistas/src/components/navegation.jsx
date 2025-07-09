import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/cartContext.jsx';

const Navbar = () => {
  // Extraemos variables del contexto de autenticación
  const { isAuthenticated, logout, user } = useAuth();
  const { cartSummary } = useCart();
  const navigate = useNavigate();

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirige al usuario a la página de login después de cerrar sesión
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/inicio">
            <img 
              src="src/images/logoproyecto-removebg-preview.png" 
              alt="logo" 
              className="logo" 
            />
          </Link>
        </div>

        {/* Botón para móvil */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* Dashboard Dropdown solo para Admin */}
            {isAuthenticated && user && user.Rol === 'Admin' && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="dashboardDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Dashboard
                </a>
                <ul className="dropdown-menu" aria-labelledby="dashboardDropdown">
                  <li>
                    <Link className="dropdown-item" to="/dashboard/ventas">
                      Ventas
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/dashboard/productos">
                      Productos
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/dashboard/usuarios">
                      Usuarios
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Otros enlaces */}
            <li className="nav-item">
              <Link className="nav-link" to="/tienda">
                Tienda
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/aboutus">
                Acerca de
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contacto">
                Contacto
              </Link>
            </li>

            {/* Dropdown de autenticación */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle" 
                href="#"
                id="authDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-fill margin-right-5"></i>
                {isAuthenticated && user ? user.NombreUsuario : "Usuario"}
              </a>
              <ul className="dropdown-menu" aria-labelledby="authDropdown">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        Perfil
                      </Link>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/login">
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/register">
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </li>

            {/* Carrito */}
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/carrito">
                <i className="bi bi-cart-fill margin-right-5"></i>
                Carrito
                {cartSummary.itemCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartSummary.itemCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;