import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../PagesCss/LoginPages.css";
import Footer from "../components/Footer.jsx";

function LoginPages() {
  const navigate = useNavigate();
  const { signin, isAuthenticated, errors: authErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // No definimos reglas de validación aquí, sólo capturamos los campos
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate("/inicio");
  }, [isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async (data) => {
    await signin({ Correo: data.Correo, Contrasena: data.Contrasena });
  });

  return (
    <section className="login-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <div className="login-container">
              <h2 className="login-title">Iniciar Sesión</h2>

              {/* Mensaje global */}
              {authErrors.general && (
                <div className="alert alert-danger text-center">
                  {authErrors.general}
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
                  {authErrors.Contrasena && (
                    <Form.Text className="text-danger">
                      {authErrors.Contrasena}
                    </Form.Text>
                  )}
                </Form.Group>

                <Button variant="primary" type="submit" className="login-button mt-3">
                  Ingresar
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
