import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { usuario } = useAuth();

  if (usuario === null) {
    // Mostrar un spinner o null mientras carga (opcional)
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("usuario");
    if (token && storedUser) {
      // Evita redirigir innecesariamente si aún no se ha rehidratado el contexto
      return null;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
