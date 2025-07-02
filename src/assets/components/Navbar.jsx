import React from 'react'
import { formatearPrecio } from '../utils/formato' // ajustar precio en CLP
import { Link } from 'react-router-dom';


const Navbar = ({total}) => {
  const token = false;

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">Alumce Control System</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav w-100">
            <li className="nav-item me-2 mb-2">
              <Link to="/" className="btn btn-dark border border-white" type="button"> Inicio</Link>
            </li>
          
          {token ? (   // condición ? valorSiVerdadero : valorSiFalso
            <>
              <li className="nav-item me-2 mb-2">
                <Link to="/ProfilePage" className="btn btn-dark border border-white" type="button"><i className="fa-solid fa-user-lock"></i> Profile</Link>
              </li>
              <li className="nav-item me-2 mb-2">
                <button className="btn btn-dark border border-white" type="button"><i className="fa-solid fa-lock"></i> Logout</button>
              </li>
            </>
          ) : (

            <>
              <li className="nav-item me-2 mb-2">
                <Link to="/LoginPage" className="btn btn-dark border border-white" type="button"><i className="fa-solid fa-lock-open"></i> Login</Link>
              </li>
              <li className="nav-item me-2 mb-2">
                <Link to="/RegisterPage" className="btn btn-dark border border-white" type="button"><i className="fa-solid fa-user-lock"></i> Registrar</Link>
              </li>
            </>
          )
          }
            <li className="nav-item ms-auto">
            <Link to="/Cart" className="btn btn-dark border border-primary text-primary" type="button">
              <i className="fa-solid fa-cart-shopping"></i> Total: ${formatearPrecio(total)}
            </Link>
            </li>
          </ul>  
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
