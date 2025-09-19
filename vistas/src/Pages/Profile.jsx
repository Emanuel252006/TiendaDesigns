// src/Pages/Profile.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { updateProfileRequest, changePasswordRequest } from "../api/userApi";
import Swal from "sweetalert2";
import "../PagesCss/Profiles.css";
import Footer from "../components/Footer.jsx";

function Profile() {
  // Obtenemos el usuario del contexto de autenticación
  const { user, logout, loadProfile, updateProfile, errors } = useAuth();
  const navigate = useNavigate();

  // Estado para el formulario y uno para guardar el estado inicial
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    city: "",
    postal: ""
  });
  const [initialFormData, setInitialFormData] = useState({});

  // Al cargar el componente, cargar el perfil completo y setear los estados
  useEffect(() => {
    const loadUserProfile = async () => {
      // Cargar el perfil completo
      const result = await loadProfile();
      
      if (!result.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el perfil completo',
          confirmButtonColor: '#3085d6'
        });
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, []); // Solo se ejecuta al montar el componente

  // Cuando el usuario cambie, actualizar el formulario
  useEffect(() => {
    if (user) {
      const initialData = {
        name: user.NombreUsuario || "",
        email: user.Correo || "",
        phone: user.Telefono || "",
        address: user.Direccion || "",
        country: user.Pais || "",
        city: user.Ciudad || "",
        postal: user.CodigoPostal || ""
      };

      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [user]);

  // Captura los cambios en los inputs
  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };

  // Al enviar el formulario, se comparan los datos actuales con los iniciales para determinar
  // qué campos han sido modificados. Luego, se mapea ese diff a los nombres de campo que espera el backend.
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Calcular sólo los campos que han cambiado
    const diff = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== initialFormData[key]) {
        diff[key] = formData[key];
      }
    });

    if (Object.keys(diff).length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se realizaron cambios en el perfil',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Mapear las claves del diff a los nombres que utiliza el backend
    const updatePayload = {};
    if (diff.name) updatePayload.NombreUsuario = diff.name;
    if (diff.email) updatePayload.Correo = diff.email;
    if (diff.phone) updatePayload.Telefono = diff.phone;
    if (diff.address) updatePayload.Direccion = diff.address;
    if (diff.country) updatePayload.Pais = diff.country;
    if (diff.city) updatePayload.Ciudad = diff.city;
    if (diff.postal) updatePayload.CodigoPostal = diff.postal;

    try {
      const result = await updateProfile(updatePayload);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Perfil actualizado exitosamente',
          confirmButtonColor: '#3085d6'
        });
        
        // Actualizamos el estado inicial para reflejar los cambios en el formulario
        setInitialFormData(formData);
        
        // Los datos ya se actualizaron automáticamente en el contexto
        // No necesitamos recargar nada adicional
      }
      // Si no es success, los errores ya se manejan en el contexto
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "Error inesperado al actualizar el perfil",
        confirmButtonColor: '#3085d6'
      });
    }
  };

  // Estado para el formulario de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Estado para errores de contraseña
  const [passwordErrors, setPasswordErrors] = useState({});

  // Lógica para el formulario de actualización de contraseña
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    // Limpiar errores previos
    setPasswordErrors({});

    try {
      const response = await changePasswordRequest({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      // Mostrar mensaje de éxito y redirigir
      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login.',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false
      }).then(async () => {
        // Limpiar el formulario
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        // Hacer logout y redirigir al login
        console.log('🔄 Iniciando logout...');
        await logout();
        console.log('✅ Logout completado, redirigiendo...');
        
        // Agregar un pequeño delay para asegurar que el contexto se actualice
        setTimeout(() => {
          navigate("/login");
        }, 100);
      });
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      // Mostrar error específico de contraseña actual incorrecta primero
      if (error.response?.data?.message === "La contraseña actual es incorrecta.") {
        setPasswordErrors({ currentPassword: error.response.data.message });
        setTimeout(() => setPasswordErrors({}), 4000);
      } else if (error.response?.data && typeof error.response.data === 'object') {
        setPasswordErrors(error.response.data);
        setTimeout(() => setPasswordErrors({}), 4000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || "Error al cambiar la contraseña",
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="profile-page">
          <div className="profile-container">
            {/* Formulario para actualizar los datos del perfil */}
            <div className="profile-info">
              <h1>Mi Perfil</h1>
              <form className="profile-form" onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label htmlFor="name">Nombre:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Ingresa tu nombre"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.NombreUsuario && (
                    <div className="error-message">{errors.NombreUsuario}</div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Correo:</label>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    placeholder="Ingresa tu correo"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.Correo && (
                    <div className="error-message">{errors.Correo}</div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Teléfono:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Ej: +57 300 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.Telefono && (
                    <div className="error-message">{errors.Telefono}</div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="address">Dirección:</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Ingresa tu dirección"
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {errors.Direccion && (
                    <div className="error-message">{errors.Direccion}</div>
                  )}
                </div>
                <div className="profile-details">
                  <div className="form-group">
                    <label htmlFor="country">País:</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      placeholder="Ingresa tu país"
                      value={formData.country}
                      onChange={handleChange}
                    />
                    {errors.Pais && (
                      <div className="error-message">{errors.Pais}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">Ciudad:</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="Ingresa tu ciudad"
                      value={formData.city}
                      onChange={handleChange}
                    />
                    {errors.Ciudad && (
                      <div className="error-message">{errors.Ciudad}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="postal">Código Postal:</label>
                    <input
                      type="text"
                      id="postal"
                      name="postal"
                      placeholder="Ingresa tu código postal"
                      value={formData.postal}
                      onChange={handleChange}
                    />
                    {errors.CodigoPostal && (
                      <div className="error-message">{errors.CodigoPostal}</div>
                    )}
                  </div>
                </div>
                <button type="submit" className="update-button">
                  Actualizar Perfil
                </button>
              </form>
            </div>

            {/* Formulario para actualizar la contraseña */}
            <div className="password-form">
              <h2>Cambiar Contraseña</h2>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Contraseña Actual:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  {passwordErrors.currentPassword && (
                    <div className="error-message">
                      {Array.isArray(passwordErrors.currentPassword)
                        ? passwordErrors.currentPassword[0]
                        : passwordErrors.currentPassword}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">Nueva Contraseña:</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Ingresa la nueva contraseña"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  {passwordErrors.newPassword && (
                    <div className="error-message">
                      {Array.isArray(passwordErrors.newPassword)
                        ? passwordErrors.newPassword[0]
                        : passwordErrors.newPassword}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirma la nueva contraseña"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="error-message">
                      {Array.isArray(passwordErrors.confirmPassword)
                        ? passwordErrors.confirmPassword[0]
                        : passwordErrors.confirmPassword}
                    </div>
                  )}
                </div>
                <button type="submit" className="update-button">
                  Cambiar Contraseña
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;