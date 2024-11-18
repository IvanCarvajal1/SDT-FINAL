import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const Navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('uid');
    localStorage.removeItem('role'); // Elimina el rol al cerrar sesión
    setIsAuthenticated(false);
    setRole(null);
    Navigate('/');
    window.location.reload();
  };

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role'); // Obtiene el rol de localStorage
      setIsAuthenticated(!!token);
      setRole(storedRole);
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {isAuthenticated ? (
        <nav className="navbar">
          <div className="navbar-header">
            <button className="navbar-toggler" onClick={toggleMenu}>
              <span className="navbar-icon"></span>
              <span className="navbar-icon"></span>
              <span className="navbar-icon"></span>
            </button>
          </div>
          <ul className={`navbar-menu ${isOpen ? 'open' : ''}`}>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/sobre-nosotros">Sobre Nosotros</Link></li>
            <li><Link to="/menu">Menú</Link></li>
            {role === 'cliente' && (
              <>
                <li><Link to="/reservar">Reservar</Link></li>
                <li><Link to="/mis-reservas">Ver mis Reservas</Link></li>
              </>
            )}
            {role === 'admin' && (
              <>
                <li><Link to="/ver-reservas-admin">Ver Reservas</Link></li>
                <li><Link to="/reservar-admin">Gestor Reserva</Link></li> {/* reserva admin*/}
              </>
            )}
            <li><Link to="/contacto">Contacto</Link></li>
            <li><button onClick={logout}>Cerrar Sesión</button></li>
          </ul>
        </nav>
      ) : (
        <nav className="navbar">
          <ul className={`navbar-menu ${isOpen ? 'open' : ''}`}>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/sobre-nosotros">Sobre Nosotros</Link></li>
            <li><Link to="/menu">Menú</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/iniciar-sesion">Iniciar Sesión</Link></li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default Navbar;
