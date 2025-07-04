// src/components/CustomImage.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const DEFAULT_SRC = `${API_BASE}/images/default.png`;

export default function CustomImage({ folder, filename: raw, alt, className }) {
  // saca sólo la parte final del path
  const clean = raw ? raw.replace(/^\/+/, "").split("/").pop() : null;
  const initial = clean
    ? `${API_BASE}/images/${folder}/${clean}`
    : DEFAULT_SRC;

  const [src, setSrc] = useState(initial);

  const onError = () => {
    if (src !== DEFAULT_SRC) setSrc(DEFAULT_SRC);
  };

  return <img src={src} alt={alt} className={className} onError={onError} />;
}