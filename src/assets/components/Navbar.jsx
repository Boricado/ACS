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
              <li>
                <a href="#inventarioSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Inventario</a>
                <ul className="collapse list-unstyled" id="inventarioSubmenu">
                  <li><Link to="#">Ingreso de inventario</Link></li>
                  <li><Link to="#">Salidas de inventario</Link></li>
                  <li><Link to="#">Ver stock reservado</Link></li>
                  <li><Link to="#">Solicitud de materiales</Link></li>
                </ul>
              </li>
              <li>
                <a href="#pautasSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Pautas de Oficina Técnica</a>
                <ul className="collapse list-unstyled" id="pautasSubmenu">
                  <li><Link to="#">Material</Link></li>
                  <li><Link to="#">Vidrios</Link></li>
                  <li><Link to="#">Herrajes</Link></li>
                  <li><Link to="#">Planillas de corte</Link></li>
                  <li><Link to="#">Material de instalación y despacho</Link></li>
                  <li><Link to="#">Guías de Despacho</Link></li>
                </ul>
              </li>
            </ul>
          </li>

          {/* Oficina Técnica */}
          <li>
            <a href="#oficinaSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Oficina Técnica</a>
            <ul className="collapse list-unstyled" id="oficinaSubmenu">
              <li><Link to="#">Inventario</Link></li>
              <li>
                <a href="#planillasTrabajoSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Planillas de Trabajo</a>
                <ul className="collapse list-unstyled" id="planillasTrabajoSubmenu">
                  <li><Link to="#">Perfiles</Link></li>
                  <li><Link to="#">Refuerzos</Link></li>
                  <li><Link to="#">Herraje</Link></li>
                  <li><Link to="#">Tornillo</Link></li>
                  <li><Link to="#">Accesorios</Link></li>
                  <li><Link to="#">Gomas y cepillos</Link></li>
                  <li><Link to="#">Vidrios</Link></li>
                  <li><Link to="#">Material de Instalación</Link></li>
                </ul>
              </li>
              <li><Link to="#">Planillas de Corte</Link></li>
            </ul>
          </li>

          {/* Adquisiciones */}
          <li>
            <a href="#adquisicionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Adquisiciones</a>
            <ul className="collapse list-unstyled" id="adquisicionesSubmenu">
              <li><Link to="#">Inventario</Link></li>
              <li><Link to="#">Histórico de Compras</Link></li>
              <li>
                <a href="#proveedoresSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Proveedores</a>
                <ul className="collapse list-unstyled" id="proveedoresSubmenu">
                  <li><Link to="#">Ingreso Proveedores</Link></li>
                </ul>
              </li>
              <li>
                <a href="#ordenesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Órdenes de Compra</a>
                <ul className="collapse list-unstyled" id="ordenesSubmenu">
                  <li><Link to="/CrearOCPage">Crear Orden de compra</Link></li>
                  <li><Link to="#">OC vigentes</Link></li>
                </ul>
              </li>
              <li>
                <a href="#inventarioAdqSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Inventario</a>
                <ul className="collapse list-unstyled" id="inventarioAdqSubmenu">
                  <li><Link to="#">Ingreso de inventario</Link></li>
                </ul>
              </li>
              <li><Link to="#">Solicitudes Bodega</Link></li>
            </ul>
          </li>

          {/* Operaciones */}
          <li>
            <a href="#operacionesSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Operaciones</a>
            <ul className="collapse list-unstyled" id="operacionesSubmenu">
              <li><Link to="#">Programación</Link></li>
              <li><Link to="#">Fabricación</Link></li>
              <li>
                <a href="#despachoSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Despacho</a>
                <ul className="collapse list-unstyled" id="despachoSubmenu">
                  <li><Link to="#">Guías de despacho</Link></li>
                </ul>
              </li>
              <li>
                <a href="#pagosSubmenu" data-bs-toggle="collapse" className="dropdown-toggle">Pagos</a>
                <ul className="collapse list-unstyled" id="pagosSubmenu">
                  <li><Link to="#">Clientes</Link></li>
                  <li><Link to="#">Proveedores</Link></li>
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
