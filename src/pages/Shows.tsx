import { useState } from 'react';
import ShowCard from '../components/ShowCard';
import { shows } from '../data/shows';
import styles from './Shows.module.css';

const FILTERS = ['Todos', 'Marzo', 'Abril', 'Mayo', 'Agosto'];

export default function Shows() {
  const [filter, setFilter] = useState('Todos');

  const filtered = shows.filter(s => {
    if (filter === 'Todos') return true;
    return s.dateLabel.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className={styles.page}>
      {/* Hero banner */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <h1 className={styles.heroTitle}>Shows</h1>
      </section>

      <div className={styles.main}>
        {/* Filter */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Shows</label>
            <select
              className={styles.filterSelect}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <span className="section-watermark" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
            PROXIMOS SHOWS
          </span>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map(s => <ShowCard key={s.id} show={s} />)}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p>No hay shows para el filtro seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
