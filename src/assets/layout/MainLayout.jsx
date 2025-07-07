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
        style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
      >
        {/* Contenedor principal con centrado vertical y horizontal */}
        <main className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="w-100 p-3" style={{ maxWidth: '900px' }}>
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
