import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

// Built-in SVG logo — replace with your AI-generated logo image:
// 1. Generate logo using the prompt in README.md
// 2. Save as: public/images/pacify-logo.svg  (or .png)
// 3. Replace <PacifyLogoSVG /> below with:
//    <img src="/images/pacify-logo.svg" alt="Pacify" className={styles.logoImg} />
function PacifyLogoSVG() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoSvg}>
      <circle cx="18" cy="18" r="16" stroke="url(#pg)" strokeWidth="2"/>
      <line x1="18" y1="4" x2="18" y2="32" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="8" y2="28" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="28" y2="28" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 12 Q18 8 26 12" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M7 16 Q18 10 29 16" stroke="#7c3aed" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

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
        <Link to="/" className={styles.logo}>
          <PacifyLogoSVG />
          <span className={styles.logoText}>Pacify</span>
        </Link>

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

        <div className={styles.buttons}>
          <button className={styles.btnLogin}>Iniciar sesion</button>
          <button className={styles.btnRegister}>Crear cuenta</button>
        </div>

        <button className={styles.menuToggle} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

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
