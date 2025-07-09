// src/pages/RegisterPages.jsx

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { startRegisterRequest, verifyRegisterCodeRequest } from "../api/userApi";
import VerificationModal from "../components/VerificationModal";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../PagesCss/RegisterPages.css";
import Footer from "../components/Footer.jsx";

function RegisterPages() {
  const navigate = useNavigate();
  const { signup, errors: authErrors, loading } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalCorreo, setModalCorreo] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [errors, setErrors] = useState({});
  const userDataRef = useRef(null); // Para guardar los datos originales
  let resendTimeout = null;

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const t = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(t);
    }
  }, [errors]);

  const onSubmit = async (data) => {
    setErrors({});
    setRegisterSuccess(false);
    setSuccessMsg("");
    try {
      // Forzar Rol a 'Cliente' siempre
      const dataWithRol = { ...data, Rol: 'Cliente' };
      const res = await startRegisterRequest(dataWithRol);
      setModalCorreo(data.Correo);
      setShowModal(true);
      setModalError("");
      userDataRef.current = dataWithRol; // Guardar datos para reenvío
    } catch (err) {
      const payload = err.response?.data;
      if (payload && typeof payload === "object") setErrors(payload);
      else setErrors({ general: payload?.message || "Error al registrar." });
    }
  };

  const handleVerifyCode = async (code) => {
    setModalLoading(true);
    setModalError("");
    try {
      const res = await verifyRegisterCodeRequest({ Correo: modalCorreo, code });
      setRegisterSuccess(true);
      setShowModal(false);
      setSuccessMsg("¡Registro exitoso! Redirigiendo a iniciar sesión…");
      reset();
      setTimeout(() => {
        setSuccessMsg("");
        navigate("/login");
      }, 2000);
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.code) setModalError(payload.code);
      else setModalError(payload?.message || "Error al verificar el código.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      // Reenviar con los datos originales, asegurando Rol: 'Cliente'
      const resendData = userDataRef.current
        ? { ...userDataRef.current, Rol: 'Cliente' }
        : { Correo: modalCorreo, Rol: 'Cliente' };
      await startRegisterRequest(resendData);
      setResendMsg("¡Código reenviado! Revisa tu correo.");
      setResendDisabled(true);
      resendTimeout = setTimeout(() => setResendDisabled(false), 30000); // 30s cooldown
    } catch (err) {
      // Si hay errores de validación, mostrarlos en el formulario y cerrar el modal
      const payload = err.response?.data;
      if (payload && typeof payload === "object") {
        setShowModal(false);
        setErrors(payload);
      } else {
        setResendMsg("No se pudo reenviar el código. Intenta más tarde.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <section className="register-page">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6}>
              <div className="register-container">
                <h2 className="register-title">Crear Cuenta</h2>

                <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                  {/* Nombre de Usuario */}
                  <Form.Group
                    controlId="nombreUsuario"
                    className="form-group-custom"
                  >
                    <Form.Label>Nombre de Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu nombre de usuario"
                      {...register("NombreUsuario")}
                    />
                    {errors.NombreUsuario && (
                      <div className="error-message">{Array.isArray(errors.NombreUsuario) ? errors.NombreUsuario[0] : errors.NombreUsuario}</div>
                    )}
                  </Form.Group>

                  {/* Email */}
                  <Form.Group controlId="email" className="form-group-custom">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu correo"
                      {...register("Correo")}
                    />
                    {errors.Correo && (
                      <div className="error-message">{Array.isArray(errors.Correo) ? errors.Correo[0] : errors.Correo}</div>
                    )}
                  </Form.Group>

                  {/* Contraseña */}
                  <Form.Group controlId="password" className="form-group-custom">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      {...register("Contrasena")}
                    />
                    {errors.Contrasena && (
                      <div className="error-message">{Array.isArray(errors.Contrasena) ? errors.Contrasena[0] : errors.Contrasena}</div>
                    )}
                  </Form.Group>

                  {/* Confirmar Contraseña */}
                  <Form.Group
                    controlId="confirmPassword"
                    className="form-group-custom"
                  >
                    <Form.Label>Confirmar Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirma tu contraseña"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <div className="error-message">{Array.isArray(errors.confirmPassword) ? errors.confirmPassword[0] : errors.confirmPassword}</div>
                    )}
                    {authErrors.general &&
                      authErrors.general
                        .toLowerCase()
                        .includes("contraseña") && (
                        <Form.Text className="text-danger">
                          {authErrors.general}
                        </Form.Text>
                      )}
                  </Form.Group>

                  <h4 className="mt-4 mb-3">Información de Dirección</h4>

                  {/* Dirección */}
                  <Form.Group
                    controlId="direccion"
                    className="form-group-custom"
                  >
                    <Form.Label>Dirección Completa</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Carrera 80 #15-20"
                      {...register("Direccion")}
                    />
                    {errors.Direccion && (
                      <div className="error-message">{Array.isArray(errors.Direccion) ? errors.Direccion[0] : errors.Direccion}</div>
                    )}
                  </Form.Group>

                  {/* Ciudad */}
                  <Form.Group controlId="ciudad" className="form-group-custom">
                    <Form.Label>Ciudad</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Medellín"
                      {...register("Ciudad")}
                    />
                    {errors.Ciudad && (
                      <div className="error-message">{Array.isArray(errors.Ciudad) ? errors.Ciudad[0] : errors.Ciudad}</div>
                    )}
                  </Form.Group>

                  {/* País */}
                  <Form.Group controlId="pais" className="form-group-custom">
                    <Form.Label>País</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Colombia"
                      {...register("Pais")}
                    />
                    {errors.Pais && (
                      <div className="error-message">{Array.isArray(errors.Pais) ? errors.Pais[0] : errors.Pais}</div>
                    )}
                  </Form.Group>

                  {/* Código Postal */}
                  <Form.Group
                    controlId="codigoPostal"
                    className="form-group-custom"
                  >
                    <Form.Label>Código Postal</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: 050021"
                      {...register("CodigoPostal")}
                    />
                    {errors.CodigoPostal && (
                      <div className="error-message">{Array.isArray(errors.CodigoPostal) ? errors.CodigoPostal[0] : errors.CodigoPostal}</div>
                    )}
                  </Form.Group>

                  {/* Mensaje de éxito inline */}
                  {successMsg && (
                    <Alert variant="success" className="mt-3">
                      {successMsg}
                    </Alert>
                  )}

                  {/* Botón de envío */}
                  <Button
                    variant="dark"
                    type="submit"
                    className="register-button btn btn-dark mt-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Registrarse"
                    )}
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <Footer />
      <VerificationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onVerify={handleVerifyCode}
        onResend={handleResend}
        correo={modalCorreo}
        error={modalError}
        loading={modalLoading}
        resendMsg={resendMsg}
        resendLoading={resendLoading}
        resendDisabled={resendDisabled}
      />
    </>
  );
}

export default RegisterPages;