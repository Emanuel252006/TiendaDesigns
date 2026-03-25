import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../PagesCss/LoginPages.css";
import Footer from "../components/Footer.jsx";
import { forgotPasswordRequest, resetPasswordRequest } from "../api/authApi";

function LoginPages() {
  const navigate = useNavigate();
  const { signin, isAuthenticated, errors: authErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Estados para recuperación de contraseña
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: pedir correo, 2: pedir código y nueva contraseña
  const [recoveryCorreo, setRecoveryCorreo] = useState("");
  const [recoveryCodigo, setRecoveryCodigo] = useState("");
  const [recoveryNueva, setRecoveryNueva] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryCooldown, setRecoveryCooldown] = useState(0);
  const [recoveryTimer, setRecoveryTimer] = useState(null);

  // Validaciones frontend para recuperación
  const [frontendErrors, setFrontendErrors] = useState({});

  // Validar correo
  const validateCorreo = (correo) => {
    if (!correo) return 'El correo es requerido';
    // Regex simple para correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) return 'Formato de correo inválido';
    return '';
  };
  // Validar código
  const validateCodigo = (codigo) => {
    if (!codigo) return 'El código es requerido';
    if (!/^[0-9]{6}$/.test(codigo)) return 'El código debe ser de 6 dígitos';
    return '';
  };
  // Validar nueva contraseña (solo requerido y mínimo)
  const validateNueva = (nueva) => {
    if (!nueva) return 'La contraseña es requerida';
    if (nueva.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    return '';
  };

  // Validar en tiempo real
  useEffect(() => {
    if (showRecovery && recoveryStep === 1) {
      setFrontendErrors({ correo: validateCorreo(recoveryCorreo) });
    } else if (showRecovery && recoveryStep === 2) {
      setFrontendErrors({
        codigo: validateCodigo(recoveryCodigo),
        nuevaContrasena: validateNueva(recoveryNueva),
      });
    } else {
      setFrontendErrors({});
    }
  }, [recoveryCorreo, recoveryCodigo, recoveryNueva, showRecovery, recoveryStep]);

  // No definimos reglas de validación aquí, sólo capturamos los campos
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Limpiar errores al montar el componente
  useEffect(() => {
    if (isAuthenticated) navigate("/inicio");
    // Limpiar errores al entrar a login
    if (authErrors && Object.keys(authErrors).length > 0) {
      // Si hay errores previos, limpiarlos
      authErrors.general = undefined;
      authErrors.Correo = undefined;
      authErrors.Contrasena = undefined;
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al cambiar de paso o escribir
  useEffect(() => {
    setRecoveryError("");
  }, [recoveryStep]);

  // Limpiar errores automáticamente después de 3 segundos
  useEffect(() => {
    if (recoveryError) {
      const timer = setTimeout(() => setRecoveryError("") , 3000);
      return () => clearTimeout(timer);
    }
  }, [recoveryError]);

  // Limpiar errores al escribir en los campos
  const handleCorreoChange = (e) => {
    setRecoveryCorreo(e.target.value);
    if (recoveryError) setRecoveryError("");
  };
  const handleCodigoChange = (e) => {
    setRecoveryCodigo(e.target.value);
    if (recoveryError) setRecoveryError("");
  };
  const handleNuevaChange = (e) => {
    setRecoveryNueva(e.target.value);
    if (recoveryError) setRecoveryError("");
  };

  // Manejar cooldown para reenviar código
  useEffect(() => {
    let timer;
    if (recoveryCooldown > 0) {
      timer = setTimeout(() => setRecoveryCooldown(recoveryCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [recoveryCooldown]);

  // Limpiar estados al volver a login
  const resetRecovery = () => {
    setShowRecovery(false);
    setRecoveryStep(1);
    setRecoveryCorreo("");
    setRecoveryCodigo("");
    setRecoveryNueva("");
    setRecoveryMsg("");
    setRecoveryError("");
    setRecoveryCooldown(0);
    setRecoveryTimer(null);
  };

  const onSubmit = handleSubmit(async (data) => {
    await signin({ Correo: data.Correo, Contrasena: data.Contrasena });
    // Forzar re-render para mostrar errores
    // (esto es útil si signin no actualiza el estado de errores correctamente)
  });

  // Solicitar código
  const handleRecoveryCorreo = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMsg("");
    try {
      await forgotPasswordRequest(recoveryCorreo);
      setRecoveryStep(2);
      setRecoveryMsg("Código enviado a tu correo. Vigente por 5 minutos.");
      setRecoveryCooldown(60); // 60s para reenviar
      setRecoveryTimer(Date.now());
    } catch (err) {
      setRecoveryError(err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Verificar código y cambiar contraseña
  const handleRecoveryReset = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMsg("");
    try {
      await resetPasswordRequest({
        correo: recoveryCorreo,
        codigo: recoveryCodigo,
        nuevaContrasena: recoveryNueva,
      });
      setRecoveryMsg("¡Contraseña actualizada! Ahora puedes iniciar sesión.");
      setTimeout(() => {
        resetRecovery();
      }, 2000);
    } catch (err) {
      setRecoveryError(err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Reenviar código
  const handleRecoveryResend = async () => {
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMsg("");
    try {
      await forgotPasswordRequest(recoveryCorreo);
      setRecoveryMsg("Nuevo código enviado a tu correo. Vigente por 5 minutos.");
      setRecoveryCooldown(60);
      setRecoveryTimer(Date.now());
    } catch (err) {
      setRecoveryError(err.message || "Error reenviando código.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Mostrar formulario de recuperación
  if (showRecovery) {
    // Parsear errores por campo si vienen como objeto y no tienen 'message'
    let fieldErrors = {};
    let generalError = "";
    if (recoveryError && typeof recoveryError === 'object' && !Array.isArray(recoveryError)) {
      if (recoveryError.message) {
        generalError = recoveryError.message;
      } else {
        fieldErrors = recoveryError;
      }
    } else if (typeof recoveryError === 'string') {
      generalError = recoveryError;
    }
    return (
      <section className="login-page">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} sm={10} md={8} lg={6}>
              <div className="login-container">
                <h2 className="login-title">Recuperar Contraseña</h2>
                {recoveryMsg && (
                  <div className="alert alert-success text-center">{recoveryMsg}</div>
                )}
                {/* Mensaje general si no es por campo */}
                {generalError && (
                  <div className="alert alert-danger text-center">{generalError}</div>
                )}
                {recoveryStep === 1 && (
                  <form onSubmit={handleRecoveryCorreo}>
                    <div className="form-group-custom">
                      <label>Correo electrónico</label>
                      <input
                        type="email"
                        className="form-control"
                        value={recoveryCorreo}
                        onChange={handleCorreoChange}
                        disabled={recoveryLoading}
                      />
                      {/* Solo errores del backend */}
                      {fieldErrors.correo && (
                        Array.isArray(fieldErrors.correo) ? (
                          fieldErrors.correo.map((err, idx) => (
                            <div key={idx} className="text-danger">{err}</div>
                          ))
                        ) : (
                          <div className="text-danger">{fieldErrors.correo}</div>
                        )
                      )}
                    </div>
                    <Button
                      variant="dark"
                      type="submit"
                      className="login-button btn btn-dark mt-3"
                      disabled={recoveryLoading}
                    >
                      {recoveryLoading ? "Enviando..." : "Enviar código"}
                    </Button>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={resetRecovery}
                      disabled={recoveryLoading}
                    >
                      Volver a iniciar sesión
                    </Button>
                  </form>
                )}
                {recoveryStep === 2 && (
                  <form onSubmit={handleRecoveryReset}>
                    <div className="form-group-custom">
                      <label>Código recibido</label>
                      <input
                        type="text"
                        className="form-control"
                        value={recoveryCodigo}
                        onChange={handleCodigoChange}
                        disabled={recoveryLoading}
                      />
                      {fieldErrors.codigo && (
                        Array.isArray(fieldErrors.codigo) ? (
                          fieldErrors.codigo.map((err, idx) => (
                            <div key={idx} className="text-danger">{err}</div>
                          ))
                        ) : (
                          <div className="text-danger">{fieldErrors.codigo}</div>
                        )
                      )}
                    </div>
                    <div className="form-group-custom">
                      <label>Nueva contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        value={recoveryNueva}
                        onChange={handleNuevaChange}
                        disabled={recoveryLoading}
                      />
                      {fieldErrors.nuevaContrasena && (
                        Array.isArray(fieldErrors.nuevaContrasena) ? (
                          fieldErrors.nuevaContrasena.map((err, idx) => (
                            <div key={idx} className="text-danger">{err}</div>
                          ))
                        ) : (
                          <div className="text-danger">{fieldErrors.nuevaContrasena}</div>
                        )
                      )}
                    </div>
                    <Button
                      variant="dark"
                      type="submit"
                      className="login-button btn btn-dark mt-3"
                      disabled={recoveryLoading}
                    >
                      {recoveryLoading ? "Verificando..." : "Cambiar contraseña"}
                    </Button>
                    <div className="d-flex flex-column align-items-center mt-3">
                      <Button
                        variant="secondary"
                        className="mt-2"
                        onClick={handleRecoveryResend}
                        disabled={recoveryLoading || recoveryCooldown > 0}
                        style={{ minWidth: 180 }}
                      >
                        {recoveryCooldown > 0 ? `Reenviar código (${recoveryCooldown}s)` : "Reenviar código"}
                      </Button>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={resetRecovery}
                        disabled={recoveryLoading}
                      >
                        Volver a iniciar sesión
                      </Button>
                    </div>
                    <div className="modal-help-msg mt-2">
                      ¿No recibiste el mensaje? Revisa tu correo (incluida la carpeta de spam) o verifica que hayas ingresado un correo real y correcto.
                    </div>
                  </form>
                )}
              </div>
            </Col>
          </Row>
        </Container>
        <Footer />
      </section>
    );
  }

  return (
    <section className="login-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <div className="login-container">
              <h2 className="login-title">Iniciar Sesión</h2>

              {/* Mensaje global */}
              {(authErrors.general || authErrors.message) && (
                <div className="alert alert-danger text-center">
                  {authErrors.general || authErrors.message}
                </div>
              )}

              <Form noValidate onSubmit={onSubmit}>
                {/* Correo */}
                <Form.Group controlId="Correo" className="form-group-custom">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ingresa tu correo"
                    {...register("Correo")}
                  />
                  {/* Sólo errores que envíe el backend */}
                  {authErrors.Correo && (
                    <Form.Text className="text-danger">
                      {authErrors.Correo}
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Contraseña */}
                <Form.Group controlId="Contrasena" className="form-group-custom">
                  <Form.Label>Contraseña</Form.Label>
                  <div>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      {...register("Contrasena")}
                    />
                    <Form.Text
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        cursor: "pointer",
                        display: "block",
                        marginTop: "0.25rem",
                        color: "#111",
                      }}
                    >
                      {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    </Form.Text>
                  </div>
                  {/* Sólo errores que envíe el backend */}
                  {authErrors.Contrasena && (
                    <Form.Text className="text-danger">
                      {authErrors.Contrasena}
                    </Form.Text>
                  )}
                </Form.Group>

                <Button 
                  variant="dark"
                  type="submit"
                  className="login-button btn btn-dark mt-3">
                  Ingresar
                </Button>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowRecovery(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </section>
  );
}

export default LoginPages;
