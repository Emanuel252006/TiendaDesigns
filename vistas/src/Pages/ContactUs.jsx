// src/Pages/ContactUs.jsx
import React, { useState } from "react";
import axios from "axios";
import "../PagesCss/ContactUS.css";
import Footer from "../components/Footer.jsx";
import contactImg from "../images/contactanos.png";

export default function Contactanos() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [message,   setMessage]   = useState("");
  const [status,    setStatus]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      await axios.post("http://localhost:5001/api/contact", {
        firstName, lastName, email, message,
      });
      setStatus({ success: "Mensaje enviado correctamente." });
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus({ error: "Error al enviar el mensaje." });
    }
  };

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

              {status?.loading && <p className="info-msg">Enviando…</p>}
              {status?.success && <p className="success-msg">{status.success}</p>}
              {status?.error   && <p className="error-msg">{status.error}</p>}

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre Completo:</label>
                  <div className="name-fields">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="Tu correo"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mensaje:</label>
                  <textarea
                    placeholder="Escribe tu mensaje..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
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