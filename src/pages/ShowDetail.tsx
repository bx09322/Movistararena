import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Car, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { shows } from '../data/shows';
import Countdown from '../components/Countdown';
import styles from './ShowDetail.module.css';

export default function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandPayment, setExpandPayment] = useState(false);
  const [expandParking, setExpandParking] = useState(false);

  const show = shows.find(s => s.id === id);

  if (!show) {
    return (
      <div className={styles.notFound}>
        <p>Show no encontrado.</p>
        <button className="btn-primary" onClick={() => navigate('/shows')}>Ver todos los shows</button>
      </div>
    );
  }

  const [day, month] = show.dateLabel.split(' ');

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{show.title}</h1>

        <div className={styles.grid}>
          {/* Left */}
          <div className={styles.left}>
            <div className={styles.imageWrapper}>
              <img
                src={`/images/${show.image}`}
                alt={show.title}
                className={styles.image}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const sib = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (sib) sib.style.display = 'flex';
                }}
              />
              <div
                className={styles.imagePlaceholder}
                style={{ background: show.bgGradient, color: show.textColor, display: 'none' }}
              >
                <span className={styles.placeholderText}>{show.title.toUpperCase()}</span>
              </div>
            </div>

            <Countdown targetDate={show.targetDate} />

            <div className={styles.about}>
              <h2 className={styles.aboutTitle}>Acerca del evento</h2>
              <p className={styles.aboutText}>{show.about}</p>
            </div>
          </div>

          {/* Right - Ticket box */}
          <div className={styles.right}>
            <div className={styles.ticketBox}>
              <div className={styles.ticketHeader}>
                <span className={styles.ticketFromLabel}>Entradas desde</span>
                <span className={styles.ticketPrice}>{show.priceLabel}</span>
              </div>

              <div className={styles.ticketBody}>
                <div className={styles.dateRow}>
                  <div className={styles.dateBadge}>
                    <span className={styles.dateBadgeDay}>{day}</span>
                    <span className={styles.dateBadgeMonth}>{month}</span>
                  </div>
                  <div className={styles.times}>
                    <div className={styles.timeItem}>
                      <span className={styles.timeLabel}>Horarios</span>
                      <span className={styles.timeVal}>{show.puertas}</span>
                      <span className={styles.timeSubLabel}>Puertas</span>
                    </div>
                    <div className={styles.timeItem}>
                      <span className={styles.timeLabel}>&nbsp;</span>
                      <span className={styles.timeVal}>{show.showTime}</span>
                      <span className={styles.timeSubLabel}>Show</span>
                    </div>
                  </div>
                  {show.sold ? (
                    <button className={styles.btnSold} disabled>Agotado</button>
                  ) : (
                    <button className={styles.btnBuySmall} onClick={() => navigate(`/checkout/${show.id}`)}>
                      Comprar
                    </button>
                  )}
                </div>

                {!show.sold && (
                  <button
                    className={styles.btnBuyBig}
                    onClick={() => navigate(`/checkout/${show.id}`)}
                  >
                    Comprar entradas
                  </button>
                )}

                {/* Accordion - Medios de pago */}
                <div className={styles.accordion}>
                  <button className={styles.accordionHeader} onClick={() => setExpandPayment(!expandPayment)}>
                    <span className={styles.accordionTitle}>
                      <CreditCard size={16} />
                      Medios de pago
                    </span>
                    <ChevronDown size={16} className={expandPayment ? styles.rotated : ''} />
                  </button>
                  {expandPayment && (
                    <div className={styles.accordionBody}>
                      <p>Visa, Mastercard, debito, transferencia bancaria y cuotas sin interes con bancos seleccionados.</p>
                    </div>
                  )}
                </div>

                {/* Accordion - Estacionamiento */}
                <div className={styles.accordion}>
                  <button className={styles.accordionHeader} onClick={() => setExpandParking(!expandParking)}>
                    <span className={styles.accordionTitle}>
                      <Car size={16} />
                      Estacionamiento
                    </span>
                    <ChevronDown size={16} className={expandParking ? styles.rotated : ''} />
                  </button>
                  {expandParking && (
                    <div className={styles.accordionBody}>
                      <p>Estacionamiento disponible en las inmediaciones del Movistar Arena. Av. Figueroa Alcorta 7597, Buenos Aires.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
