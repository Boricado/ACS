import React from 'react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          minWidth: 0, // 👈 evita overflow horizontal
        }}
      >
        {/* Contenedor principal ocupa todo el ancho */}
        <main
          className="flex-grow-1 d-flex justify-content-start align-items-start"
          style={{ overflowX: 'auto' }} // 👈 asegura scroll solo si es necesario
        >
          <div className="container-fluid p-3">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
