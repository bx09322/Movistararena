import styles from './StaticPage.module.css';

export function ComoLlegar() {
  const transport = [
    { icon: '🚇', title: 'Subte', desc: 'Linea D, estacion Palermo. 10 minutos caminando.' },
    { icon: '🚌', title: 'Colectivos', desc: 'Lineas 10, 34, 37, 59, 60, 64, 93, 111, 130, 160, 161.' },
    { icon: '🚗', title: 'Auto', desc: 'Av. Figueroa Alcorta 7597. Estacionamientos en los alrededores.' },
    { icon: '🚕', title: 'Taxi / Remis', desc: 'Acceso directo por Av. Figueroa Alcorta. Area de bajada frente al estadio.' },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>Como llegar</h1>
      </section>
      <div className={styles.content}>
        <div className={styles.address}>
          <h2>Av. Figueroa Alcorta 7597</h2>
          <p>Buenos Aires, Argentina</p>
        </div>
        <div className={styles.transportGrid}>
          {transport.map(t => (
            <div key={t.title} className={styles.transportCard}>
              <span className={styles.transportIcon}>{t.icon}</span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.mapPlaceholder}>
          <p>Mapa interactivo - Av. Figueroa Alcorta 7597, CABA</p>
        </div>
      </div>
    </div>
  );
}

export function PreguntasFrecuentes() {
  const faqs = [
    { q: '¿Como compro entradas?', a: 'Podes comprar tus entradas directamente desde nuestra web en la seccion Shows, seleccionando el evento de tu interes y siguiendo el proceso de compra.' },
    { q: '¿Que metodos de pago aceptan?', a: 'Aceptamos Visa, Mastercard, debito y transferencia bancaria. Algunos bancos tienen cuotas sin interes.' },
    { q: '¿Donde esta ubicado el Movistar Arena?', a: 'Av. Figueroa Alcorta 7597, Buenos Aires. Podes llegar en Subte Linea D (Palermo), colectivos o auto.' },
    { q: '¿Puedo cambiar o devolver mis entradas?', a: 'Las entradas no son reembolsables. En caso de cancelacion del evento, se procedera al reintegro segun la politica del organizador.' },
    { q: '¿Que esta permitido ingresar al estadio?', a: 'No se permiten camaras profesionales, comida ni bebida del exterior, ni mochilas grandes. Se permite telefonos celulares.' },
    { q: '¿Hay estacionamiento?', a: 'Si, hay estacionamientos disponibles en las inmediaciones del estadio con costo adicional.' },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>Preguntas<br />Frecuentes</h1>
      </section>
      <div className={styles.content}>
        <div className={styles.faqList}>
          {faqs.map(f => (
            <div key={f.q} className={styles.faqItem}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
