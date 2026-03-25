import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext.jsx";
import { CartProvider } from "../src/context/cartContext.jsx";
import ProtectedRouter, { AdminProtectedRoute, NonAdminProtectedRoute } from "./protectedRouter";
import HomePage from "../src/Pages/HomePage";
import LoginPage from "../src/Pages/LoginPage"; 
import RegisterPage from "../src/Pages/RegisterPage"; 
import ContactUs from "../src/Pages/ContactUs";
import AboutUs from "../src/Pages/AboutUs";
import StorePage from "../src/Pages/StorePage";
import NavigationWithConditional from "./components/navegation";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Profile from "../src/Pages/Profile";
import CartPage from "../src/Pages/CartPage";
import DetailsPage from "../src/Pages/DetailsPage";
import CheckoutPage from "../src/Pages/CheckoutPage";
import MisPedidosPage from "../src/Pages/MisPedidosPage";
import DashboardVentas from "../src/Pages/DashboardVentas";
import DashboardProductos from "../src/Pages/DashboardProductos";
import DashboardUsuarios from "../src/Pages/DashboardUsuarios";

function App() {
  return (
   <AuthProvider>
     <CartProvider>
       <BrowserRouter>
         <NavigationWithConditional />
         <Routes>
           <Route path="/" element={<Navigate to="/inicio" replace />} />
           <Route path="/inicio" element={<HomePage />} />
           <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegisterPage />} />   
           <Route path="/tienda" element={<StorePage />} />

          {/* Rutas públicas - accesibles para todos */}
          <Route path="/contacto" element={<ContactUs />} />  
          <Route path="/aboutus" element={<AboutUs />} />     
          <Route path="/detalle/:id" element={<DetailsPage />} />
          
          {/* Rutas que requieren autenticación */}
          <Route element={<ProtectedRouter />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
            <Route path="/carrito" element={<CartPage />} />    
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>

           {/* Rutas protegidas solo para administradores */}
           <Route element={<AdminProtectedRoute />}>
             <Route path="/dashboard/ventas" element={<DashboardVentas />} />
             <Route path="/dashboard/productos" element={<DashboardProductos />} />
             <Route path="/dashboard/usuarios" element={<DashboardUsuarios />} />
           </Route>
           <Route path="*" element={<Navigate to="/inicio" replace />} />
         </Routes>
       </BrowserRouter>
     </CartProvider>
   </AuthProvider>

    
  );
}

export default App;

