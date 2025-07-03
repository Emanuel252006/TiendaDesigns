// src/context/ProductContext.js
import { createContext, useContext, useState, useEffect } from "react";
import {
  getProductsRequest,
  createProductRequest,
  deleteProductRequest,
  updateProductRequest
} from "../api/productApi.js";

const ProductContext = createContext();
export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  const obtenerProductos = async () => {
    setLoading(true);
    const res = await getProductsRequest();
    setProductos(res.data);
    setLoading(false);
  };

  const crearProducto = async (datosFormData) => {
    await createProductRequest(datosFormData);
    await obtenerProductos();
  };

  const eliminarProducto = async (id) => {
    await deleteProductRequest(id);
    setProductos(productos.filter((p) => p.ProductoID !== id));
  };

  const actualizarProducto = async (id, datosFormData) => {
    await updateProductRequest(id, datosFormData);
    await obtenerProductos();
  };

  useEffect(() => {
    obtenerProductos();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        productos,
        loading,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        obtenerProductos,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};