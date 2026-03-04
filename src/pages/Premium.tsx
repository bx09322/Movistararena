import styles from './Premium.module.css';

const lounges = [
  {
    name: 'Visa Lounge',
    logo: 'VISA',
    color: '#1A1F71',
    desc: 'Espacio exclusivo para clientes Visa con las mejores vistas al escenario, servicio premium y acceso anticipado.',
  },
  {
    name: 'Club Casino Buenos Aires',
    logo: 'CASINO',
    color: '#8b1a1a',
    desc: 'Salon VIP con gastronomia de primer nivel, barra libre y ubicaciones privilegiadas para los socios del Club Casino.',
  },
  {
    name: 'Suites Corporativas',
    logo: 'SUITES',
    color: '#1a3a6a',
    desc: 'Suites privadas para empresas con capacidad para grupos, catering personalizado y atencion exclusiva.',
  },
];

export default function Premium() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>Premium</h1>
      </section>

      <div className={styles.content}>
        <p className={styles.intro}>
          En Movistar Arena podes disfrutar experiencias Premium en espacios exclusivos con las mejores vistas y servicios de primer nivel.
        </p>

        <div className={styles.cards}>
          {lounges.map(l => (
            <div key={l.name} className={styles.card}>
              <div className={styles.cardLogo} style={{ background: l.color }}>
                <span>{l.logo}</span>
              </div>
              <div className={styles.cardBody}>
                <h3>{l.name}</h3>
                <p>{l.desc}</p>
                <button className="btn-outline" style={{ marginTop: 16, fontSize: '13px' }}>
                  Solicitar informacion
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.benefitsSection}>
          <h2 className={styles.benefitsTitle}>Beneficios Premium</h2>
          <div className={styles.benefitsGrid}>
            {[
              { icon: '★', title: 'Acceso prioritario', desc: 'Entrada preferencial sin filas' },
              { icon: '◆', title: 'Vistas privilegiadas', desc: 'Las mejores ubicaciones del recinto' },
              { icon: '▼', title: 'Gastronomia', desc: 'Catering y barra con productos seleccionados' },
              { icon: '●', title: 'Atencion personalizada', desc: 'Staff dedicado a tu experiencia' },
              { icon: '■', title: 'Estacionamiento', desc: 'Cochera reservada en el lugar' },
              { icon: '▲', title: 'Souvenirs', desc: 'Pack de bienvenida exclusivo' },
            ].map(b => (
              <div key={b.title} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{b.icon}</div>
                <div>
                  <div className={styles.benefitTitle}>{b.title}</div>
                  <div className={styles.benefitDesc}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
