import { useNavigate } from 'react-router-dom';
import { Show } from '../types';
import styles from './ShowCard.module.css';

interface Props { show: Show; }

export default function ShowCard({ show }: Props) {
  const navigate = useNavigate();

  return (
    <div className="show-card" onClick={() => navigate(`/show/${show.id}`)}>
      <div className="card-image-wrapper">
        <img
          src={`/images/${show.image}`}
          alt={show.title}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const ph = img.nextElementSibling as HTMLElement;
            if (ph) ph.style.display = 'flex';
          }}
        />
        <div
          className="card-image-placeholder"
          style={{ background: show.bgGradient, color: show.textColor, display: 'none' }}
        >
          <span className={styles.placeholderText}>{show.title.toUpperCase()}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-title">{show.title}</div>
        <div className="card-date-text">{show.extraDates ?? show.dateLabel}</div>
        <div className="card-footer-row">
          <button
            className="btn-ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`/show/${show.id}`); }}
          >
            Mas info
          </button>
          <button
            className={styles.btnBuy}
            onClick={(e) => { e.stopPropagation(); navigate(`/checkout/${show.id}`); }}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
