import { Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

import MainLayout from './assets/layout/MainLayout';
import RegisterPage from './assets/views/RegisterPage';
import LoginPage from './assets/views/LoginPage';
import NotFound from './assets/views/NotFound';
import ProfilePage from './assets/views/ProfilePage';
import ClientePage from './assets/views/ClientePage';
import PresupuestoPage from './assets/views/PresupuestoPage';
import ItemPresupuestoPage from './assets/views/ItemPresupuestoPage';
import EditarItemsPresupuestoPage from './assets/views/EditarItemsPresupuestoPage';
import Home from './assets/components/Home';
import InventarioPage from './assets/views/InventarioPage';
import CrearOCPage from './assets/views/CrearOCPage';
import EditarOCPage from './assets/views/EditarOCPage';
import OCPendientePage from './assets/views/OCPendientePage'; 
import IngresosPage from './assets/views/IngresosPage';
import SalidasPage from './assets/views/SalidasPage';
import SeguimientoObrasPage from './assets/views/SeguimientoObrasPage';
import OTPautasPage from './assets/views/OTPautasPage';
import StockReservado from './assets/views/StockReservado';
import BodegaSolicitudesPage from './assets/views/BodegaSolicitudesPage';
import CrearSolicitudBodegaPage from './assets/views/CrearSolicitudBodegaPage';
import ResumenObrasMatPage from './assets/views/ResumenObrasMatPage';
import AjusteStock from './assets/views/AjusteStock';
import ProveedorPage from './assets/views/ProveedorPage';
import FacturasGuiasPage from './assets/views/FacturasGuiasPage';
import FacturasEstadoPage from './assets/views/FacturasEstadoPage';
import PagosClientesPage from './assets/views/PagosClientesPage';

import PrivateRoute from './routes/PrivateRoute';

function App() {
  return (
    <Routes>

      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas privadas con layout */}
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Home />} />
        
        {/* Rutas Globales */}
        <Route path='StockActual' element={<InventarioPage />} />

        {/* Rutas Venta de presupuestos y clientes */}
        <Route path='IngresoCliente' element={<ClientePage />} />
        <Route path='IngresoPresupuesto' element={<PresupuestoPage />} />
        <Route path='IngresoItems' element={<ItemPresupuestoPage />} />
        <Route path='EditarPresupuestos' element={<EditarItemsPresupuestoPage />} />

        {/* Rutas Bodega */}
        <Route path='IngresosPage' element={<IngresosPage />} />
        <Route path='FacturasGuiasPage' element={<FacturasGuiasPage />} />
        <Route path='SalidasPage' element={<SalidasPage />} />
        <Route path='StockReservado' element={<StockReservado />} />
        <Route path='CrearSolicitudBodegaPage' element={<CrearSolicitudBodegaPage />} />
        <Route path='BodegaSolicitudesPage' element={<BodegaSolicitudesPage />} />
        <Route path='AjusteStock' element={<AjusteStock />} />

        {/* Oficina Técnica */}
        <Route path='OTPautasPage' element={<OTPautasPage />} />

        {/* Adquisiciones */}
        <Route path='CrearOCPage' element={<CrearOCPage />} />
        <Route path='EditarOCPage' element={<EditarOCPage />} />
        <Route path='OCPendientePage' element={<OCPendientePage />} />
        <Route path='ProveedorPage' element={<ProveedorPage />} />

        {/* Operaciones */}
        <Route path='ResumenObrasMatPage' element={<ResumenObrasMatPage />} />
        <Route path='SeguimientoObrasPage' element={<SeguimientoObrasPage />} />
        <Route path='PagosClientesPage' element={<PagosClientesPage />} />
        <Route path='FacturasEstadoPage' element={<FacturasEstadoPage />} />

        {/* Perfil */}
        <Route path='ProfilePage' element={<ProfilePage />} />
      </Route>

      {/* Página no encontrada */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
