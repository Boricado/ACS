import React from 'react';
import { Link } from 'react-router-dom';
import { formatearPrecio } from '../utils/formato'; // ajuste de precio CLP
import '../styles/sidebar.css'; // Puedes personalizar con tu propio CSS
import welcomeImage from '../img/AlumceLogo.jpg';

const Sidebar = ({ total }) => {
  const token = true; // Aquí puedes reemplazarlo por un hook de auth

  return (
    <nav id="sidebar" className="bg-dark text-white">
      <div className="p-4 pt-5">
        <img
                src={welcomeImage}
                alt="Bienvenida Alumce"
                className="img-fluid mt-4 shadow rounded"
                style={{ maxWidth: '170px' }}
              />
        <h6 className="text-white">Control System</h6>
        <ul className="list-unstyled components mb-5">

          <li>
            <Link to="/">Inicio</Link>
          </li>

          {/* Ventas */}
          <li>
            <a href="#ventasSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Ventas</a>
            <ul className="collapse list-unstyled" id="ventasSubmenu">
              <li><Link to="/IngresoCliente">Ingreso clientes</Link></li>
              <li><Link to="/IngresoPresupuesto">Ingreso presupuesto</Link></li>
              <li><Link to="/IngresoItems">Ingreso ítems</Link></li>
              <li><Link to="/EditarPresupuestos">Editar Presupuestos</Link></li>
            </ul>
          </li>

          {/* Bodega */}
          <li>
            <a href="#bodegaSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Bodega</a>
            <ul className="collapse list-unstyled" id="bodegaSubmenu">
              <li><Link to="/StockActual">Stock Actual</Link></li>
              <li><Link to="/IngresosPage">Ingreso de inventario</Link></li>
              <li><Link to="/SalidasPage">Salidas de inventario</Link></li>
              <li><Link to="/StockReservado">Stock reservado por OT</Link></li>
              <li><Link to="#">Solicitud de materiales</Link></li>
            </ul>
          </li>

          {/* Oficina Técnica */}
          <li>
            <a href="#oficinaSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Oficina Técnica</a>
            <ul className="collapse list-unstyled" id="oficinaSubmenu">
              <li><Link to="/StockActual">Stock Actual</Link></li>
              <li><Link to="/OTPautasPage">Pautas de Materiales</Link></li>
              <li><Link to="#">...Planillas de Corte</Link></li>
            </ul>
          </li>

          {/* Adquisiciones */}
          <li>
            <a href="#adquisicionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Adquisiciones</a>
            <ul className="collapse list-unstyled" id="adquisicionesSubmenu">
              <li><Link to="/StockActual">Stock Actual</Link></li>
              <li>
                <a href="#ordenesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Órdenes de Compra</a>
                <ul className="collapse list-unstyled" id="ordenesSubmenu">
                  <li><Link to="/CrearOCPage">Crear Orden de compra</Link></li>
                  <li><Link to="/EditarOCPage">Editar Orden de compra</Link></li>
                  <li><Link to="/OCPendientePage">OC Pendientes/Historico de Compras</Link></li>
                </ul>
              </li>
              <li><Link to="#">Ingreso Proveedores</Link></li>
              <li><Link to="#">Ver solicitudes de Bodega</Link></li>
            </ul>
          </li>

          {/* Operaciones */}
          <li>
            <a href="#operacionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Operaciones</a>
            <ul className="collapse list-unstyled" id="operacionesSubmenu">
              <li><Link to="/SeguimientoObrasPage">Seguimiento Obras</Link></li>
              <li><Link to="#">...Programación</Link></li>
              <li><Link to="#">...Fabricación</Link></li>
              <li>
                <a href="#despachoSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Despacho</a>
                <ul className="collapse list-unstyled" id="despachoSubmenu">
                  <li><Link to="#">...Guías de despacho</Link></li>
                </ul>
              </li>
              <li>
                <a href="#pagosSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Pagos</a>
                <ul className="collapse list-unstyled" id="pagosSubmenu">
                  <li><Link to="#">...Clientes</Link></li>
                  <li><Link to="#">...Proveedores</Link></li>
                </ul>
              </li>
            </ul>
          </li>

          {/* Auth & Carrito */}
          {token ? (
            <>
              <li><Link to="/ProfilePage"><i className="fa-solid fa-user-lock"></i> Profile</Link></li>
              <li><button className="btn btn-link text-white"><i className="fa-solid fa-lock"></i> Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/LoginPage"><i className="fa-solid fa-lock-open"></i> Login</Link></li>
              <li><Link to="/RegisterPage"><i className="fa-solid fa-user-lock"></i> Registrar</Link></li>
            </>
          )}

          <li className="mt-3">
            <Link to="/Cart" className="text-info">
              <i className="fa-solid fa-cart-shopping"></i> Total: ${formatearPrecio(total)}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
