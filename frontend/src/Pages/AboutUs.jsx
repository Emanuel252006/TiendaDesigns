import React from "react";
import "../PagesCss/AboutUs.css";
import Footer from "../components/Footer";
import brandImg from "../images/acercade.png";
import objectiveImg from "../images/objetivo.png";

const EcommercePage = () => {
  return (
    <>
      <div className="about-container">
        {/* Bloque 1: imagen izquierda, texto oculto a la derecha */}
        <div className="info-block info-block-first">
          <img
            src={brandImg}
            alt="Acerca de la marca"
            className="info-image"
          />
          <div className="info-text">
            Somos una marca de ropa que nace con el propósito de redefinir la
            forma en la que te expresas a través de tu estilo. En nuestro
            e-commerce fusionamos moda urbana, confort y autenticidad para
            brindarte prendas únicas, versátiles y con identidad propia.
          </div>
        </div>

        {/* Bloque 2: imagen derecha, texto oculto a la izquierda */}
        <div className="info-block info-block-second">
          <img
            src={objectiveImg}
            alt="Nuestro objetivo"
            className="info-image"
          />
          <div className="info-text">
            Consolidar a SCE-Designs como la marca de moda urbana de referencia,
            redefiniendo la manera en que las personas se expresan a través de
            su estilo al ofrecer prendas auténticas, confortables y versátiles
            que reflejen la identidad única de cada cliente.
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default EcommercePage;