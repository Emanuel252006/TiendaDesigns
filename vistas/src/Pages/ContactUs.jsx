import React from 'react';
import '../PagesCss/ContactUS.css';
import Footer from "../components/Footer";

const Contactanos = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="contactanos-page">
          <div className="contactanos-container">
            <div className="contactanos-info">
              <h1>Contáctanos</h1>
              <p>
                Estamos aquí para ayudarte. Escríbenos tu consulta o sugerencia y nos comunicaremos contigo a la mayor brevedad.
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong>samuelarboleda004@gmail.com</p>
                <p><strong>Teléfono:</strong>310 41961 25</p>
              </div>
              <form className="contact-form">
                <div className="form-group">
                  <label>Nombre Completo:</label>
                  <div className="name-fields">
                    <input type="text" placeholder="Nombre" required />
                    <input type="text" placeholder="Apellido" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Correo Electrónico:</label>
                  <input type="email" placeholder="Tu correo" required />
                </div>
                <div className="form-group">
                  <label>Mensaje:</label>
                  <textarea placeholder="Escribe tu mensaje..." required></textarea>
                </div>
                <button type="submit">Enviar</button>
              </form>
            </div>

            <div className="contactanos-illustration">
              <img src="src/images/contactanos.png" alt="Imagen de contacto" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contactanos;
