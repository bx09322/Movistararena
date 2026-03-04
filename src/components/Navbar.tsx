import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/shows', label: 'Shows' },
    { to: '/como-llegar', label: 'Como llegar' },
    { to: '/premium', label: 'Premium' },
    { to: '/preguntas', label: 'Preguntas Frecuentes' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <div className={styles.logoBar} />
            <div className={styles.logoM}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 13V1L6 8L9 3L12 8L17 1V13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.logoBar} />
          </div>
          <span className={styles.logoText}>Movistar Arena</span>
        </Link>

        {/* Links */}
        <ul className={styles.links}>
          <li>
            <Link to="/" className={`${styles.iconLink} ${location.pathname === '/' ? styles.active : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </Link>
          </li>
          {links.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`${styles.link} ${location.pathname === l.to ? styles.active : ''}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className={styles.buttons}>
          <button className={styles.btnLogin}>Iniciar sesion</button>
          <button className={styles.btnRegister}>Crear cuenta</button>
        </div>

        {/* Mobile toggle */}
        <button className={styles.menuToggle} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Inicio</Link>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className={styles.mobileBtns}>
            <button className={styles.btnLogin}>Iniciar sesion</button>
            <button className={styles.btnRegister}>Crear cuenta</button>
          </div>
        </div>
      )}
    </nav>
  );
}
