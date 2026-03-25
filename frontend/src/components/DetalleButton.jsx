import React from "react";
import { Link } from "react-router-dom";
import "./DetalleButton.css";

const DetalleButton = ({ to, label = "Ver detalle" }) => {
  return (
    <Link to={to} className="detalle-button-link">
      <button className="detalle-button">{label}</button>
    </Link>
  );
};

export default DetalleButton;
