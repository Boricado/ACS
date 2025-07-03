import React from 'react';
import welcomeImage from '../img/AlumceLogo.jpg'; // asegúrate que la imagen exista

const Home = () => {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center text-center"
      style={{ minHeight: '100vh' }}
    >
      <h1 className="mb-4">Bienvenido a Alumce Control System</h1>
      <p className="lead">Sistema integral de gestión para producción, inventario y administración.</p>
      <img
        src={welcomeImage}
        alt="Bienvenida Alumce"
        className="img-fluid mt-4 shadow rounded"
        style={{ maxWidth: '600px' }}
      />
    </div>
  );
};

export default Home;
