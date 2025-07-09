// src/Pages/ContactUs.jsx
import { useState } from "react";
import axios from "axios";
import "../PagesCss/ContactUS.css";
import Footer from "../components/Footer.jsx";
import contactImg from "../images/contactanos.png";
import React from "react"; // Added missing import for React.useEffect

export default function Contactanos() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [message,   setMessage]   = useState("");
  const [status,    setStatus]    = useState(null);
  // Estado para errores
  const [errors, setErrors] = useState({});

  // Validación de email
  const validateEmail = (email) => {
    // Regex simple para validar email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validación individual en cada campo
  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
    setErrors((prev) => ({
      ...prev,
      firstName: e.target.value.trim() ? undefined : "El nombre es obligatorio."
    }));
  };
  const handleLastNameChange = (e) => {
    setLastName(e.target.value);
    setErrors((prev) => ({
      ...prev,
      lastName: e.target.value.trim() ? undefined : "El apellido es obligatorio."
    }));
  };
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({
      ...prev,
      email: !e.target.value.trim()
        ? "El correo es obligatorio."
        : !validateEmail(e.target.value)
        ? "Correo inválido."
        : undefined
    }));
  };
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setErrors((prev) => ({
      ...prev,
      message: e.target.value.trim() ? undefined : "El mensaje es obligatorio."
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar todos los campos antes de enviar
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "El nombre es obligatorio.";
    if (!lastName.trim()) newErrors.lastName = "El apellido es obligatorio.";
    if (!email.trim()) newErrors.email = "El correo es obligatorio.";
    else if (!validateEmail(email)) newErrors.email = "Correo inválido.";
    if (!message.trim()) newErrors.message = "El mensaje es obligatorio.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setStatus({ loading: true });
    try {
      await axios.post("http://localhost:3001/api/contact", {
        nombre: `${firstName} ${lastName}`.trim(),
        email,
        mensaje: message
      });
      setStatus({ success: "Mensaje enviado correctamente." });
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
      setErrors({});
    } catch (err) {
      console.error(err);
      setStatus({ error: "Error al enviar el mensaje." });
    }
  };

  // Limpiar mensajes de status y errores después de 4 segundos
  React.useEffect(() => {
    if (status?.success || status?.error) {
      const timer = setTimeout(() => {
        setStatus(null);
        setErrors({});
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Limpiar errores de campos después de 4 segundos si hay errores y no hay status
  React.useEffect(() => {
    if (Object.keys(errors).length > 0 && !status?.success && !status?.error) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [errors, status]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="contactanos-page">
          <div className="contactanos-container">

            <div className="contactanos-info">
              <h1>Contáctanos</h1>
              <p>
                Estamos aquí para ayudarte. Escríbenos tu consulta o sugerencia
                y nos comunicaremos contigo a la mayor brevedad.
              </p>

              {/* Mensaje de estado: Enviando, Éxito, Error */}
              {status?.loading && !status?.error && (
                <p className="info-msg">Enviando…</p>
              )}
              {status?.loading && status?.error && (
                <p className="error-msg">Enviando…</p>
              )}
              {status?.success && <p className="success-msg">{status.success}</p>}
              {status?.error   && <p className="error-msg">{status.error}</p>}

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre Completo:</label>
                  <div className="name-fields">
                    <div style={{width: '100%'}}>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={firstName}
                        onChange={handleFirstNameChange}
                      />
                      {errors.firstName && (
                        <div className="error-msg" style={{marginTop: 4}}>{errors.firstName}</div>
                      )}
                    </div>
                    <div style={{width: '100%'}}>
                      <input
                        type="text"
                        placeholder="Apellido"
                        value={lastName}
                        onChange={handleLastNameChange}
                      />
                      {errors.lastName && (
                        <div className="error-msg" style={{marginTop: 4}}>{errors.lastName}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="Tu correo"
                    value={email}
                    onChange={handleEmailChange}
                  />
                  {errors.email && (
                    <div className="error-msg" style={{marginTop: 4}}>{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Mensaje:</label>
                  <textarea
                    placeholder="Escribe tu mensaje..."
                    value={message}
                    onChange={handleMessageChange}
                  />
                  {errors.message && (
                    <div className="error-msg" style={{marginTop: 4}}>{errors.message}</div>
                  )}
                </div>

                <button type="submit">Enviar</button>
              </form>
            </div>

            <div className="contactanos-illustration">
              <img
                src={contactImg}
                alt="Ilustración contacto"
                className="contact-image"
              />
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}