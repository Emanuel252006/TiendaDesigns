import React from "react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import "./Footer.css"; 

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-text">
          <p>
            Contacto:{" "}
            <a href="mailto:samuelarboleda008@gmail.com">
              samuelarboleda008@gmail.com
            </a>{" "}
            | Teléfono: +57 310 41961 25
          </p>
        </div>
        <div className="footer-icons">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
            <FaTiktok />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <FaFacebook />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
