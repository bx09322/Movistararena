import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <div className={styles.logoBar} />
            <div className={styles.logoM}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M1 13V1L6 8L9 3L12 8L17 1V13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.logoBar} />
            <span className={styles.logoText}>Movistar Arena</span>
          </div>
          <p className={styles.address}>Av. Figueroa Alcorta 7597, Buenos Aires</p>
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
        <span>2026 Movistar Arena. Todos los derechos reservados.</span>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Admin</a>
      </div>
    </footer>
  );
}
