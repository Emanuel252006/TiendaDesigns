// src/Pages/AboutUs.jsx
import React from "react";
import "../PagesCss/AboutUs.css";
import Footer from "../components/Footer";

const EcommercePage = () => {
  return (
    <>
      {/* Sección Acerca de la Marca */}
      <div className="container ecommerce-page mt-spacing">
        <div className="row align-items-center mb-5">
          <div className="col-md-6 text-column">
            <h2>Acerca de Nuestra Marca</h2>
            <p>
              Somos una marca de ropa que nace con el propósito de redefinir la
              forma en la que te expresas a través de tu estilo. En nuestro
              e-commerce fusionamos moda urbana, confort y autenticidad para
              brindarte prendas únicas, versátiles y con identidad propia.
            </p>
          </div>
          <div className="col-md-6 image-column">
            <img
              src="src/images/1.png"
              alt="Nuestra marca"
              className="img-fluid rounded-image"
            />
          </div>
        </div>
      </div>

      {/* Sección de Contacto */}
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-row">
            <div className="text-column-left">
              <h2>Trabaja con nosotros</h2>
              <p>
                ¿Quieres que trabajemos juntos? Ingresa tus datos y nos
                pondremos en contacto contigo.
              </p>
            </div>
            <div className="contact-form-wrapper">
              <form className="contact-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="formNameInput">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        id="formNameInput"
                        placeholder="Tu nombre"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="formLastNameInput">Apellidos</label>
                      <input
                        type="text"
                        className="form-control"
                        id="formLastNameInput"
                        placeholder="Tus apellidos"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="formEmailInput">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="formEmailInput"
                    placeholder="ejemplo@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="formMessageInput">Mensaje</label>
                  <textarea
                    className="form-control"
                    id="formMessageInput"
                    rows="3"
                    placeholder="Escribe tu mensaje aquí..."
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-dark submit-button">
                  ENVIAR
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default EcommercePage;