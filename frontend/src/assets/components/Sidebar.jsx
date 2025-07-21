import React from 'react';
import { NavLink } from 'react-router-dom';
import { formatearPrecio } from '../utils/formato';
import { useAuth } from '../../context/AuthContext';
import '../styles/sidebar.css';
import welcomeImage from '../img/AlumceLogo.jpg';

const Sidebar = ({ total }) => {
  const { usuario, logout } = useAuth();
  const accesoTotal = ['Gerencia', 'Contabilidad', 'Informático', 'Ventas', 'Oficina Técnica', 'Adquisiciones', 'Operaciones', 'Fábrica'].includes(usuario?.rol);

  return (
    <nav id="sidebar" className="bg-dark text-white">
      <div className="p-4 pt-5">
        <img
          src={welcomeImage}
          alt="Bienvenida Alumce"
          className="img-fluid mt-4 shadow rounded"
          style={{ maxWidth: '170px' }}
        />
        <h6 className="text-white">Control System v0.3b</h6>
        <ul className="list-unstyled components mb-5">
          <li><NavLink to="/" className={({ isActive }) => isActive ? 'active-link' : ''}>Inicio</NavLink></li>

          {/* Ventas */}
          {(usuario?.rol === 'Ventas' || accesoTotal) && (
            <>
              <li>
                <a href="#ventasSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Ventas</a>
                <ul className="collapse list-unstyled" id="ventasSubmenu">
                  <li><NavLink to="/IngresoCliente" className={({ isActive }) => isActive ? 'active-link' : ''}>Ingreso clientes</NavLink></li>
                  <li><NavLink to="/IngresoPresupuesto" className={({ isActive }) => isActive ? 'active-link' : ''}>Ingreso presupuesto</NavLink></li>
                  <li><NavLink to="/IngresoItems" className={({ isActive }) => isActive ? 'active-link' : ''}>... Ingreso ítems</NavLink></li>
                  <li><NavLink to="/EditarPresupuestos" className={({ isActive }) => isActive ? 'active-link' : ''}>... Editar Presupuestos</NavLink></li>
                </ul>
              </li>
            </>
          )}

          {/* Bodega */}
          {(usuario?.rol === 'Bodega' || usuario?.rol === 'Fábrica' || accesoTotal) && (
            <li>
              <a href="#bodegaSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Bodega</a>
              <ul className="collapse list-unstyled" id="bodegaSubmenu">
                <li><NavLink to="/StockActual" className={({ isActive }) => isActive ? 'active-link' : ''}>Stock Actual</NavLink></li>
                <li><NavLink to="/IngresosPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Ingreso de Facturas/Guias</NavLink></li>
                <li><NavLink to="/SalidasPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Salidas de Material</NavLink></li>
                <li><NavLink to="/StockReservado" className={({ isActive }) => isActive ? 'active-link' : ''}>Stock reservado por OT</NavLink></li>
                <li><NavLink to="/CrearSolicitudBodegaPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Solicitud de materiales a OT</NavLink></li>
                <li><NavLink to="/SeguimientoObrasPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Seguimiento Obras</NavLink></li>
                <li><NavLink to="/AjusteStock" className={({ isActive }) => isActive ? 'active-link' : ''}>Ajuste de Stock/ Inventario</NavLink></li>
              </ul>
            </li>
          )}

          {/* Oficina Técnica */}
          {(usuario?.rol === 'Oficina Técnica' || accesoTotal) && (
            <li>
              <a href="#oficinaSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Oficina Técnica</a>
              <ul className="collapse list-unstyled" id="oficinaSubmenu">
                <li><NavLink to="/StockActual" className={({ isActive }) => isActive ? 'active-link' : ''}>Stock Actual</NavLink></li>
                <li><NavLink to="/OTPautasPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Pautas de Materiales</NavLink></li>
                <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Planillas de Corte</NavLink></li>
              </ul>
            </li>
          )}

          {/* Adquisiciones */}
          {(usuario?.rol === 'Adquisiciones' || accesoTotal) && (
            <li>
              <a href="#adquisicionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Adquisiciones</a>
              <ul className="collapse list-unstyled" id="adquisicionesSubmenu">
                <li><NavLink to="/StockActual" className={({ isActive }) => isActive ? 'active-link' : ''}>Stock Actual</NavLink></li>
                <li>
                  <a href="#ordenesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Órdenes de Compra</a>
                  <ul className="collapse list-unstyled" id="ordenesSubmenu">
                    <li><NavLink to="/CrearOCPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Crear Orden de compra</NavLink></li>
                    <li><NavLink to="/EditarOCPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Editar Orden de compra</NavLink></li>
                    <li><NavLink to="/OCPendientePage" className={({ isActive }) => isActive ? 'active-link' : ''}>OC Pendientes/Historico de Compras</NavLink></li>
                    <li><NavLink to="/ProveedorPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Crear/ Editar Proveedores</NavLink></li>
                  </ul>
                </li>
                <li><NavLink to="#">... Ingreso Proveedores</NavLink></li>
                <li><NavLink to="/BodegaSolicitudesPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Ver solicitudes de Bodega</NavLink></li>
              </ul>
            </li>
          )}

          {/* Operaciones */}
          {(usuario?.rol === 'Operaciones' || accesoTotal) && (
            <li>
              <a href="#operacionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Operaciones</a>
              <ul className="collapse list-unstyled" id="operacionesSubmenu">
                <li><NavLink to="/ResumenObrasMatPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Resumen de Obras y Materiales</NavLink></li>
                <li><NavLink to="/SeguimientoObrasPage" className={({ isActive }) => isActive ? 'active-link' : ''}>Seguimiento Obras</NavLink></li>
                <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Programación</NavLink></li>
                <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Fabricación</NavLink></li>
                <li>
                  <a href="#despachoSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">...Despacho</a>
                  <ul className="collapse list-unstyled" id="despachoSubmenu">
                    <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Guías de despacho</NavLink></li>
                  </ul>
                </li>
                <li>
                  <a href="#pagosSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">...Pagos</a>
                  <ul className="collapse list-unstyled" id="pagosSubmenu">
                    <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Clientes</NavLink></li>
                    <li><NavLink to="#" className={({ isActive }) => isActive ? 'active-link' : ''}>... Proveedores</NavLink></li>
                  </ul>
                </li>
              </ul>
            </li>
          )}

          {/* Perfil y logout */}
          {usuario ? (
            <>
              <li><NavLink to="/ProfilePage" className={({ isActive }) => isActive ? 'active-link' : ''}><i className="fa-solid fa-user-lock"></i> {usuario.nombre}</NavLink></li>
              <li>
                <button onClick={logout} className="btn btn-link text-white">
                  <i className="fa-solid fa-lock"></i> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/LoginPage" className={({ isActive }) => isActive ? 'active-link' : ''}><i className="fa-solid fa-lock-open"></i> Login</NavLink></li>
              <li><NavLink to="/RegisterPage" className={({ isActive }) => isActive ? 'active-link' : ''}><i className="fa-solid fa-user-lock"></i> Registrar</NavLink></li>
            </>
          )}

         
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
