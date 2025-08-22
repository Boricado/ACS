import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Cierra el sidebar al pasar a desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cierra el sidebar al navegar (cambio de ruta)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Bloquea el scroll del body cuando el sidebar está abierto (móvil)
  useEffect(() => {
    if (isSidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
  }, [isSidebarOpen]);

  // Cierra con tecla Escape
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setIsSidebarOpen(false);
  }, []);
  useEffect(() => {
    if (!isSidebarOpen) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen, onKeyDown]);

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar: desktop en flujo normal; mobile como off-canvas */}
      <aside
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        // ARIA: cuando está como off-canvas en móvil, trátalo como diálogo
        role="dialog"
        aria-modal={isSidebarOpen ? 'true' : undefined}
        aria-label="Menú lateral"
      >
        <Sidebar />
      </aside>

      {/* Backdrop para mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido */}
      <div
        className="content flex-grow-1 d-flex flex-column"
        style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', minWidth: 0 }}
      >
        {/* Barra superior (solo móvil) con botón hamburguesa */}
        <header className="d-lg-none d-flex align-items-center gap-2 p-2 border-bottom bg-white">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
            aria-controls="sidebar"
            aria-expanded={isSidebarOpen}
          >
            ☰
          </button>
          <span className="fw-semibold">Menú</span>
        </header>

        <main
          className="flex-grow-1 d-flex justify-content-start align-items-start"
          style={{ overflowX: 'auto' }}
        >
          {/* A todo ancho, sin padding lateral extra */}
          <div className="container-fluid px-0 p-3">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
