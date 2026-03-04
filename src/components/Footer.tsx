import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="16" stroke="url(#fg)" strokeWidth="2"/>
              <line x1="18" y1="4" x2="18" y2="32" stroke="url(#fg)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="18" y1="18" x2="8" y2="28" stroke="url(#fg)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="18" y1="18" x2="28" y2="28" stroke="url(#fg)" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 12 Q18 8 26 12" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Pacify</span>
          </div>
          <p className={styles.address}>Buenos Aires, Argentina</p>
        </div>

        <div className={styles.links}>
          <h4>Navegacion</h4>
          <a href="/shows">Shows</a>
          <a href="/como-llegar">Como llegar</a>
          <a href="/premium">Premium</a>
          <a href="/preguntas">Preguntas frecuentes</a>
        </div>

        <div className={styles.links}>
          <h4>Legal</h4>
          <a href="#">Terminos y condiciones</a>
          <a href="#">Politica de privacidad</a>
          <a href="#">Politica de reembolsos</a>
        </div>

        <div className={styles.links}>
          <h4>Redes sociales</h4>
          <a href="#">Instagram</a>
          <a href="#">Facebook</a>
          <a href="#">Twitter / X</a>
          <a href="#">YouTube</a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>2026 Pacify. Todos los derechos reservados.</span>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>Admin</a>
      </div>
    </footer>
  );
}
