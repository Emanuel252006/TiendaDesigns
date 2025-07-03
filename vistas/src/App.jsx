import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext.jsx";
import ProtectedRouter from "./protectedRouter";
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

function App() {
  return (
   <AuthProvider>
  <BrowserRouter>
    <NavigationWithConditional />
    <Routes>
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />   
      <Route path="/contacto" element={<ContactUs />} />  
      <Route path="/aboutus" element={<AboutUs />} />     
      <Route path="/profile" element={<Profile />} />  
      <Route path="/tienda" element={<StorePage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRouter />}>
        <Route path="/carrito" element={<CartPage />} />    
        <Route path="/detalle/:id" element={<DetailsPage />} />    
        {/* Puedes agregar más rutas protegidas aquí */}
      </Route>
      
    </Routes>
  </BrowserRouter>
</AuthProvider>

    
  );
}

export default App;

