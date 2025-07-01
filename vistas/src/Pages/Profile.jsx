// src/Pages/Profile.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx"; // Asegúrate de que la ruta sea correcta
import "../PagesCss/Profiles.css";
import Footer from "../components/Footer.jsx";

function Profile() {
  // Obtenemos el usuario del contexto de autenticación
  const { user } = useAuth();

  // Estado para el formulario y uno para guardar el estado inicial
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    country: "",
    city: "",
    postal: ""
  });
  const [initialFormData, setInitialFormData] = useState({});

  // Al cargar el componente, si hay usuario logueado, se setean ambos estados
  useEffect(() => {
    if (user) {
      const initialData = {
        name: user.NombreUsuario || "",
        email: user.Correo || "",
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
      console.log("No se realizaron cambios.");
      return;
    }

    // Mapear las claves del diff a los nombres que utiliza el backend
    const updatePayload = {};
    if (diff.name) updatePayload.NombreUsuario = diff.name;
    if (diff.email) updatePayload.Correo = diff.email;
    if (diff.address) updatePayload.Direccion = diff.address;
    if (diff.country) updatePayload.Pais = diff.country;
    if (diff.city) updatePayload.Ciudad = diff.city;
    if (diff.postal) updatePayload.CodigoPostal = diff.postal;

    try {
      // Llamada a la API para actualizar el perfil.
      // Por ejemplo: await updateUserRequest(updatePayload);
      console.log("Campos actualizados:", updatePayload);

      // Actualizamos el estado inicial para reflejar los cambios en el formulario
      setInitialFormData(formData);
    } catch (error) {
      // Manejo de errores
      console.error("Error al actualizar el perfil:", error);
    }
  };

  // Lógica para el formulario de actualización de contraseña (placeholder)
  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    console.log("Actualización de contraseña");
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
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Correo:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Ingresa tu correo"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Dirección:</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Ingresa tu dirección"
                    required
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="profile-details">
                  <div className="form-group">
                    <label htmlFor="country">País:</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      placeholder="Ingresa tu país"
                      required
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">Ciudad:</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="Ingresa tu ciudad"
                      required
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postal">Código Postal:</label>
                    <input
                      type="text"
                      id="postal"
                      name="postal"
                      placeholder="Ingresa tu código postal"
                      required
                      value={formData.postal}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <button type="submit" className="update-button">
                  Actualizar Perfil
                </button>
              </form>
            </div>

            {/* Formulario para actualizar la contraseña */}
            <div className="password-form">
              <h2>Recuperar Contraseña</h2>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Contraseña Actual:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="Ingresa tu contraseña actual"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">Nueva Contraseña:</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Ingresa la nueva contraseña"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirma la nueva contraseña"
                    required
                  />
                </div>
                <button type="submit" className="update-button">
                  Actualizar Contraseña
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