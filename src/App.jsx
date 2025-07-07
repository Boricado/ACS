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

function App() {
  return (
    <Routes>
      <Route path='/' element={<MainLayout />}>
        <Route index element={<Home />} />
        {/* Rutas de presupuestos y clientes */}
        <Route path='IngresoCliente' element={<ClientePage />} />
        <Route path='IngresoPresupuesto' element={<PresupuestoPage />} />
        <Route path='IngresoItems' element={<ItemPresupuestoPage />} />
        <Route path='EditarPresupuestos' element={<EditarItemsPresupuestoPage />} />

        {/* Rutas de inventario */}
        <Route path='StockActual' element={<InventarioPage />} />
        <Route path='IngresosPage' element={<IngresosPage />} />
        <Route path='SalidasPage' element={<SalidasPage />} />
        <Route path='StockReservado' element={<StockReservado />} />
        <Route path='CrearSolicitudBodegaPage' element={<CrearSolicitudBodegaPage />} />

        {/* Rutas de pautas de oficina técnica */}

        <Route path='OTPautasPage' element={<OTPautasPage />} />

        {/* Rutas de órdenes de compra */}
        <Route path='CrearOCPage' element={<CrearOCPage />} />
        <Route path='EditarOCPage' element={<EditarOCPage />} />
        <Route path='OCPendientePage' element={<OCPendientePage />} />
        <Route path='BodegaSolicitudesPage' element={<BodegaSolicitudesPage />} />

        <Route path='SeguimientoObrasPage' element={<SeguimientoObrasPage />} />
        
        {/* Rutas de autenticación */}
        <Route path='RegisterPage' element={<RegisterPage />} />
        <Route path='LoginPage' element={<LoginPage />} />
        <Route path='ProfilePage' element={<ProfilePage />} />
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
