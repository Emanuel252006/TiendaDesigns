import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../PagesCss/RegisterPages.css";
import Footer from "../components/Footer.jsx";

function RegisterPages() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, errors: authErrors } = useAuth();
  const { register, handleSubmit } = useForm();

  // Si ya está autenticado, redirige a /inicio
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => navigate("/inicio"), 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    // Validación local mínima para confirmar contraseñas
    if (data.password !== data.confirmPassword) {
      return alert("Las contraseñas no coinciden.");
    }

    await signup({
      NombreUsuario: data.nombreUsuario,
      Correo: data.email,
      Contrasena: data.password,
      Rol: "Cliente",
      Direccion: data.direccion,
      Ciudad: data.ciudad,
      Pais: data.pais,
      CodigoPostal: data.codigoPostal,
    });
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
                  <Form.Group controlId="nombreUsuario" className="form-group-custom">
                    <Form.Label>Nombre de Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu nombre de usuario"
                      {...register("nombreUsuario")}
                    />
                    {authErrors.NombreUsuario && (
                      <Form.Text className="text-danger">
                        {authErrors.NombreUsuario}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* Email */}
                  <Form.Group controlId="email" className="form-group-custom">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Ingresa tu email"
                      {...register("email")}
                    />
                    {authErrors.Correo && (
                      <Form.Text className="text-danger">
                        {authErrors.Correo}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* Contraseña */}
                  <Form.Group controlId="password" className="form-group-custom">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      {...register("password")}
                    />
                    {authErrors.Contrasena && (
                      <Form.Text className="text-danger">
                        {authErrors.Contrasena}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* Confirmar Contraseña */}
                  <Form.Group controlId="confirmPassword" className="form-group-custom">
                    <Form.Label>Confirmar Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirma tu contraseña"
                      {...register("confirmPassword")}
                    />
                    {/* Si el back devuelve un error general sobre contraseñas */}
                    {authErrors.general &&
                      authErrors.general.toLowerCase().includes("contraseña") && (
                        <Form.Text className="text-danger">
                          {authErrors.general}
                        </Form.Text>
                      )}
                  </Form.Group>

                  <h4 className="mt-4 mb-3">Información de Dirección</h4>

                  {/* Dirección */}
                  <Form.Group controlId="direccion" className="form-group-custom">
                    <Form.Label>Dirección Completa</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Carrera 80 #15-20"
                      {...register("direccion")}
                    />
                    {authErrors.Direccion && (
                      <Form.Text className="text-danger">
                        {authErrors.Direccion}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* Ciudad */}
                  <Form.Group controlId="ciudad" className="form-group-custom">
                    <Form.Label>Ciudad</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu ciudad"
                      {...register("ciudad")}
                    />
                    {authErrors.Ciudad && (
                      <Form.Text className="text-danger">
                        {authErrors.Ciudad}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* País */}
                  <Form.Group controlId="pais" className="form-group-custom">
                    <Form.Label>País</Form.Label>
                    <Form.Select {...register("pais")}>
                      <option value="">Seleccione un país</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Ecuador">Ecuador</option>
                      <option value="Venezuela">Venezuela</option>
                      <option value="Brasil">Brasil</option>
                    </Form.Select>
                    {authErrors.Pais && (
                      <Form.Text className="text-danger">
                        {authErrors.Pais}
                      </Form.Text>
                    )}
                  </Form.Group>

                  {/* Código Postal */}
                  <Form.Group controlId="codigoPostal" className="form-group-custom">
                    <Form.Label>Código Postal</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ingresa tu código postal"
                      {...register("codigoPostal")}
                    />
                    {authErrors.CodigoPostal && (
                      <Form.Text className="text-danger">
                        {authErrors.CodigoPostal}
                      </Form.Text>
                    )}
                  </Form.Group>

                  <Button variant="primary" type="submit" className="register-button mt-3">
                    Registrarse
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <Footer />
    </>
  );
}

export default RegisterPages;
