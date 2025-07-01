import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../PagesCss/HomePages.css";
import DetalleButton from "../components/DetalleButton.jsx";
import Footer from "../components/Footer.jsx";
import Navigation from '../components/navegation.jsx';

const HomePage = () => {
  return (
    <>
      {/* Menú: Se importa el componente Navbar */}
      <Navigation />

      {/* Header: Imagen principal con texto centrado */}
      <header className="main-header position-relative">
        <div className="container-fluid">
          <div className="header-image position-relative">
            <img
              src="src/images/imggrande.jpg"
              alt="Moda Formal"
              className="img-fluid header-img"
            />
            {/* Overlay con texto centrado */}
            <div className="header-overlay">
              <h1 className="header-title">Elegancia y Estilo en Ropa Formal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Sección de catálogo de productos */}
      <section className="product-catalog py-5">
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-center">Productos Destacados</h2>
            </div>
          </div>
          <div className="row justify-content-center">
            {/* Producto 1 */}
            <div className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center">
              <div className="card">
                <img
                  src="src/images/destacada1.jpg"
                  className="card-img-top"
                  alt="Suéter Beige"
                />
                <div className="card-body text-center">
                  <h5 className="card-title">Suéter Beige</h5>
                  <p className="card-text">$45.000</p>
                  <DetalleButton to="/detalle" label="Ver Detalle" />
                </div>
              </div>
            </div>

            {/* Producto 2 */}
            <div className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center">
              <div className="card">
                <img
                  src="src/images/destacada3.jpg"
                  className="card-img-top"
                  alt="Pantalones"
                />
                <div className="card-body text-center">
                  <h5 className="card-title">Pantalón Café</h5>
                  <p className="card-text">$50.000</p>
                  <DetalleButton to="/detalle" label="Ver Detalle" />
                </div>
              </div>
            </div>

            {/* Producto 3 */}
            <div className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center">
              <div className="card">
                <img
                  src="src/images/destacada2.jpg"
                  className="card-img-top"
                  alt="Zapatos de Vestir"
                />
                <div className="card-body text-center">
                  <h5 className="card-title">Zapato formal</h5>
                  <p className="card-text">$60.000</p>
                  <DetalleButton to="/detalle" label="Ver Detalle" />
                </div>
              </div>
            </div>

            {/* Producto 4 */}
            <div className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center">
              <div className="card">
                <img
                  src="src/images/traje azul.png"
                  className="card-img-top"
                  alt="Blazer Azul"
                />
                <div className="card-body text-center">
                  <h5 className="card-title">Blazer Azul</h5>
                  <p className="card-text">$120.000</p>
                  <DetalleButton to="/detalle" label="Ver Detalle" />
                </div>
              </div>
            </div>

            {/* Producto 5 */}
            <div className="col-lg-2 col-md-2 col-sm-4 mb-4 d-flex justify-content-center">
              <div className="card">
                <img
                  src="src/images/camisa blanca.png"
                  className="card-img-top"
                  alt="Camisa Blanca Clásica"
                />
                <div className="card-body text-center">
                  <h5 className="card-title">Camisa Blanca</h5>
                  <p className="card-text">$30.000</p>
                  <DetalleButton to="/detalle" label="Ver Detalle" />
                </div>
              </div>
            </div>
          </div>

          {/* Botón VER TODO */}
          <div className="row mt-4">
            <div className="col text-center">
              <a href="/tienda" className="btn btn-secondary">
                VER TODO
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default HomePage;
