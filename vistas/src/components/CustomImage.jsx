// src/components/CustomImage.jsx
import React, { useState } from "react";
import { IMAGES_BASE_URL } from "../config/runtime.js";

const DEFAULT_SRC = `${IMAGES_BASE_URL}/default.png`;

export default function CustomImage({ folder, filename: raw, alt, className }) {
  // saca sólo la parte final del path
  const clean = raw ? raw.replace(/^\/+/, "").split("/").pop() : null;
  const initial = clean
    ? `${IMAGES_BASE_URL}/${folder}/${clean}`
    : DEFAULT_SRC;

  const [src, setSrc] = useState(initial);

  const onError = () => {
    if (src !== DEFAULT_SRC) setSrc(DEFAULT_SRC);
  };

  return <img src={src} alt={alt} className={className} onError={onError} />;
}