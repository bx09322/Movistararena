import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ShowCard from '../components/ShowCard';
import { newShows, upcomingShows } from '../data/shows';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />

        {/* Light beams */}
        <div className={styles.beams}>
          {[-25, -12, -3, 8, 18, 28].map((deg, i) => (
            <div key={i} className={styles.beam} style={{ left: `${15 + i * 14}%`, transform: `rotate(${deg}deg)`, opacity: 0.3 + i * 0.05 }} />
          ))}
        </div>

        {/* Crowd SVG */}
        <svg className={styles.crowd} viewBox="0 0 1440 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,160 L0,90 Q30,65 60,80 Q90,95 120,70 Q150,45 180,62 Q210,79 240,52 Q270,25 300,48 Q330,71 360,44 Q390,17 420,38 Q450,59 480,32 Q510,5 540,28 Q570,51 600,24 Q630,0 660,26 Q690,52 720,28 Q750,4 780,30 Q810,56 840,34 Q870,12 900,38 Q930,64 960,42 Q990,20 1020,46 Q1050,72 1080,52 Q1110,32 1140,58 Q1170,84 1200,64 Q1230,44 1260,70 Q1290,96 1320,76 Q1350,56 1380,82 Q1410,108 1440,90 L1440,160 Z" fill="white" />
        </svg>

        <div className={styles.heroOverlay} />

        <div className={`${styles.heroContent} fade-up`}>
          <h1 className={styles.heroTitle}>
            Vivi la mejor<br />
            <span className={styles.cursive}>experiencia</span><br />
            de la musica en vivo
          </h1>
        </div>
      </section>

      {/* Nuevos Shows */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Nuevos shows</h2>
          <span className="section-watermark">NUEVOS</span>
        </div>
        <div className={styles.grid}>
          {newShows.map(s => <ShowCard key={s.id} show={s} />)}
        </div>
      </section>

      {/* Proximos Shows */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Proximos shows</h2>
          <button className="btn-outline" style={{ fontSize: '13px', padding: '8px 18px' }} onClick={() => navigate('/shows')}>
            Todos los shows <ChevronRight size={14} />
          </button>
          <span className="section-watermark">PROXIMOS SHOWS</span>
        </div>
        <div className={styles.grid}>
          {upcomingShows.slice(0, 6).map(s => <ShowCard key={s.id} show={s} />)}
        </div>
      </section>
    </div>
  );
}
