import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import styles from './Countdown.module.css';

interface Props {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ targetDate }: Props) {
  const [t, setT] = useState<TimeLeft>(getTimeLeft(targetDate));

  useEffect(() => {
    const iv = setInterval(() => setT(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(iv);
  }, [targetDate]);

  const units = [
    { val: t.days,    label: 'Dias' },
    { val: t.hours,   label: 'Horas' },
    { val: t.minutes, label: 'Minutos' },
    { val: t.seconds, label: 'Segundos' },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <Clock size={18} />
        <span>Faltan</span>
      </div>
      <div className={styles.units}>
        {units.map((u, i) => (
          <div key={u.label} className={styles.unitGroup}>
            <span className={styles.val}>{pad(u.val)}</span>
            <span className={styles.label}>{u.label}</span>
            {i < units.length - 1 && <span className={styles.sep}>|</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
