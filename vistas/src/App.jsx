import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext.jsx";
import { CartProvider } from "../src/context/cartContext.jsx";
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
import CheckoutPage from "../src/Pages/CheckoutPage";
import CheckoutSuccessPage from "../src/Pages/CheckoutSuccessPage";

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
           <Route path="/contacto" element={<ContactUs />} />  
           <Route path="/aboutus" element={<AboutUs />} />     
           <Route path="/profile" element={<Profile />} />  
           <Route path="/tienda" element={<StorePage />} />

           {/* Rutas protegidas */}
           <Route element={<ProtectedRouter />}>
             <Route path="/carrito" element={<CartPage />} />    
             <Route path="/detalle/:id" element={<DetailsPage />} />    
             <Route path="/checkout" element={<CheckoutPage />} />
             <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
             {/* Puedes agregar más rutas protegidas aquí */}
           </Route>
           <Route path="*" element={<Navigate to="/inicio" replace />} />
         </Routes>
       </BrowserRouter>
     </CartProvider>
   </AuthProvider>

    
  );
}

export default App;

