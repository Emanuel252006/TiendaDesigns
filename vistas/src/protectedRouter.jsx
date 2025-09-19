import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "./context/authContext";

const ProtectedRoute = () => {
    const { loading, isAuthenticated, user } = useAuth();
    const { userId: routeUserId } = useParams();

    if (loading) return <h1>Loading...</h1>;
    if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;
    if (routeUserId && routeUserId !== user?._id) return <Navigate to="/not-authorized" replace />;

    return <Outlet />;
};

// Componente para proteger rutas que requieren rol de administrador
const AdminProtectedRoute = () => {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <h1>Loading...</h1>;
    if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;
    if (!user || user.Rol !== 'Admin') return <Navigate to="/inicio" replace />;

    return <Outlet />;
};

// Componente para proteger rutas que NO deben ser accesibles para administradores
const NonAdminProtectedRoute = () => {
    const { loading, isAuthenticated, user } = useAuth();

    if (loading) return <h1>Loading...</h1>;
    if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;
    if (user && user.Rol === 'Admin') return <Navigate to="/inicio" replace />;

    return <Outlet />;
};

export default ProtectedRoute;
export { AdminProtectedRoute, NonAdminProtectedRoute };