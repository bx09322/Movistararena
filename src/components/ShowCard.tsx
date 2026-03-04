import { useNavigate } from 'react-router-dom';
import { Show } from '../types';
import styles from './ShowCard.module.css';

interface Props {
  show: Show;
}

export default function ShowCard({ show }: Props) {
  const navigate = useNavigate();

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!show.sold) navigate(`/checkout/${show.id}`);
  };

  return (
    <div className={`show-card ${styles.card}`} onClick={() => navigate(`/show/${show.id}`)}>
      <div className="card-image-wrapper">
        <img
          src={`/images/${show.image}`}
          alt={show.title}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const placeholder = parent.querySelector(`.${styles.placeholder}`) as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }
          }}
        />
        <div
          className={`card-image-placeholder ${styles.placeholder}`}
          style={{ background: show.bgGradient, color: show.textColor, display: 'none' }}
        >
          <span className={styles.placeholderTitle}>{show.title.toUpperCase()}</span>
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
            className={show.sold ? styles.btnSold : styles.btnBuy}
            onClick={handleBuy}
            disabled={show.sold}
          >
            {show.sold ? 'Agotado' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
}
