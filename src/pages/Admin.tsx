import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, DollarSign, Ticket, Trash2, Search,
  ArrowLeft, TrendingUp, Calendar, CreditCard, Download, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { getPurchases, deletePurchase, formatCurrency, maskCard } from '../utils/storage';
import { PurchaseData } from '../types';
import styles from './Admin.module.css';

function VisaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 44 28" fill="none">
      <rect width="44" height="28" rx="4" fill="white"/>
      <text x="5" y="20" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#1A1F71">VISA</text>
    </svg>
  );
}

function MastercardLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.63)} viewBox="0 0 44 28" fill="none">
      <rect width="44" height="28" rx="4" fill="white"/>
      <circle cx="16" cy="14" r="8" fill="#EB001B"/>
      <circle cx="28" cy="14" r="8" fill="#F79E1B"/>
      <path d="M22 7.8a8 8 0 010 12.4A8 8 0 0122 7.8z" fill="#FF5F00"/>
    </svg>
  );
}

type SortField = 'createdAt' | 'totalAmount' | 'showTitle' | 'firstName';
type SortDir = 'asc' | 'desc';

export default function Admin() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<PurchaseData | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (authenticated) setPurchases(getPurchases());
  }, [authenticated]);

  function refresh() {
    setPurchases(getPurchases());
  }

  function handleDelete(id: string) {
    if (confirm('Eliminar esta compra?')) {
      deletePurchase(id);
      refresh();
      if (selected?.id === id) setSelected(null);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function handleLogin() {
    if (adminPass === 'admin123') {
      setAuthenticated(true);
      setPassError('');
    } else {
      setPassError('Contrasena incorrecta');
    }
  }

  const filtered = purchases
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.showTitle.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.dni.includes(q);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let va: string | number = a[sortField];
      let vb: string | number = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalRevenue = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const confirmedCount = purchases.filter(p => p.status === 'confirmed').length;

  function exportCSV() {
    const headers = ['ID', 'Show', 'Fecha Show', 'Cliente', 'DNI', 'Email', 'Telefono', 'Sector', 'Cantidad', 'Total', 'Tarjeta', 'Tipo', 'Estado', 'Fecha Compra'];
    const rows = filtered.map(p => [
      p.id, p.showTitle, p.showDate, `${p.firstName} ${p.lastName}`, p.dni, p.email, p.phone,
      p.section, p.quantity, p.totalAmount, maskCard(p.cardNumber), p.cardType, p.status,
      new Date(p.createdAt).toLocaleString('es-AR')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-movistar-arena-${Date.now()}.csv`;
    a.click();
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginBox}>
          <div className={styles.loginIcon}>
            <ShieldCheck size={36} color="#00aaff" />
          </div>
          <h1 className={styles.loginTitle}>Panel Administrativo</h1>
          <p className={styles.loginSub}>Movistar Arena - Acceso restringido</p>
          <div className="form-group" style={{ width: '100%' }}>
            <label className="form-label">Contrasena de administrador</label>
            <input
              className={`form-input ${passError ? 'error' : ''}`}
              type="password"
              placeholder="Ingresa la contrasena"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {passError && <span className="form-error">{passError}</span>}
          </div>
          <button className={styles.loginBtn} onClick={handleLogin}>
            Ingresar al panel
          </button>
          <button className={styles.loginBack} onClick={() => navigate('/')}>
            <ArrowLeft size={14} />
            Volver al sitio
          </button>
          <p className={styles.loginHint}>Contrasena demo: admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M1 13V1L6 8L9 3L12 8L17 1V13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className={styles.sidebarLogoText}>Movistar Arena</div>
            <div className={styles.sidebarLogoSub}>Panel Admin</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <Ticket size={16} />
            Ventas
          </div>
          <div className={styles.navItem} onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Volver al sitio
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Gestion de Ventas</h1>
            <p className={styles.pageSub}>Historial completo de compras realizadas</p>
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.iconBtn} onClick={refresh} title="Actualizar">
              <RefreshCw size={16} />
            </button>
            <button className={styles.iconBtn} onClick={exportCSV} title="Exportar CSV">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(0,170,255,0.15)', color: '#00aaff' }}>
              <Ticket size={20} />
            </div>
            <div>
              <div className={styles.statValue}>{purchases.length}</div>
              <div className={styles.statLabel}>Total ventas</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(39,174,96,0.15)', color: '#2ecc71' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className={styles.statValue}>{formatCurrency(totalRevenue)}</div>
              <div className={styles.statLabel}>Ingresos totales</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6' }}>
              <Users size={20} />
            </div>
            <div>
              <div className={styles.statValue}>{confirmedCount}</div>
              <div className={styles.statLabel}>Confirmadas</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(243,156,18,0.15)', color: '#f39c12' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div className={styles.statValue}>
                {purchases.length > 0 ? formatCurrency(Math.round(totalRevenue / purchases.length)) : '$ 0'}
              </div>
              <div className={styles.statLabel}>Ticket promedio</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.searchWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre, email, DNI, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidas</option>
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Ticket size={48} color="rgba(255,255,255,0.15)" />
            <p>No hay compras registradas aun.</p>
            <span>Las compras realizadas en el sitio apareceran aqui.</span>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => handleSort('createdAt')}>
                    <span>Fecha <SortIcon field="createdAt" /></span>
                  </th>
                  <th className={styles.th} onClick={() => handleSort('firstName')}>
                    <span>Cliente <SortIcon field="firstName" /></span>
                  </th>
                  <th className={styles.th}>DNI</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th} onClick={() => handleSort('showTitle')}>
                    <span>Show <SortIcon field="showTitle" /></span>
                  </th>
                  <th className={styles.th}>Sector</th>
                  <th className={styles.th}>Cant.</th>
                  <th className={styles.th}>Tarjeta</th>
                  <th className={styles.th} onClick={() => handleSort('totalAmount')}>
                    <span>Total <SortIcon field="totalAmount" /></span>
                  </th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    className={`${styles.tr} ${selected?.id === p.id ? styles.trSelected : ''}`}
                    onClick={() => setSelected(s => s?.id === p.id ? null : p)}
                  >
                    <td className={styles.td}>
                      <div className={styles.dateCell}>
                        <Calendar size={13} />
                        {new Date(p.createdAt).toLocaleDateString('es-AR')}
                        <span>{new Date(p.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{p.firstName[0]}{p.lastName[0]}</div>
                        <div>
                          <div className={styles.nameFull}>{p.firstName} {p.lastName}</div>
                          <div className={styles.phone}>{p.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}><span className={styles.mono}>{p.dni}</span></td>
                    <td className={styles.td}><span className={styles.emailCell}>{p.email}</span></td>
                    <td className={styles.td}>
                      <div className={styles.showCell}>
                        <div className={styles.showName}>{p.showTitle}</div>
                        <div className={styles.showDate}>{p.showDate}</div>
                      </div>
                    </td>
                    <td className={styles.td}><span className="badge badge-blue">{p.section}</span></td>
                    <td className={styles.td}><span className={styles.qty}>{p.quantity}</span></td>
                    <td className={styles.td}>
                      <div className={styles.cardCell}>
                        {p.cardType === 'visa' && <VisaLogo size={36} />}
                        {p.cardType === 'mastercard' && <MastercardLogo size={36} />}
                        <span className={styles.cardMask}>{maskCard(p.cardNumber)}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.amount}>{formatCurrency(p.totalAmount)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={`badge ${p.status === 'confirmed' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                        {p.status === 'confirmed' ? 'Confirmada' : p.status === 'pending' ? 'Pendiente' : 'Fallida'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button
                        className={styles.deleteBtn}
                        onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className={styles.detailPanel}>
            <div className={styles.detailPanelHeader}>
              <h3>Detalle de compra</h3>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>x</button>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailSection}>
                <h4>Datos del cliente</h4>
                <div className={styles.detailRow}><span>Nombre</span><strong>{selected.firstName} {selected.lastName}</strong></div>
                <div className={styles.detailRow}><span>DNI</span><strong>{selected.dni}</strong></div>
                <div className={styles.detailRow}><span>Email</span><strong>{selected.email}</strong></div>
                <div className={styles.detailRow}><span>Telefono</span><strong>{selected.phone}</strong></div>
              </div>
              <div className={styles.detailSection}>
                <h4>Datos del show</h4>
                <div className={styles.detailRow}><span>Show</span><strong>{selected.showTitle}</strong></div>
                <div className={styles.detailRow}><span>Fecha</span><strong>{selected.showDate}</strong></div>
                <div className={styles.detailRow}><span>Sector</span><strong>{selected.section}</strong></div>
                <div className={styles.detailRow}><span>Cantidad</span><strong>{selected.quantity}</strong></div>
              </div>
              <div className={styles.detailSection}>
                <h4>Datos de pago</h4>
                <div className={styles.detailRow}>
                  <span>Tarjeta</span>
                  <strong className={styles.cardRowDetail}>
                    {selected.cardType === 'visa' && <VisaLogo size={30} />}
                    {selected.cardType === 'mastercard' && <MastercardLogo size={30} />}
                    {maskCard(selected.cardNumber)}
                  </strong>
                </div>
                <div className={styles.detailRow}><span>Titular</span><strong>{selected.cardHolder}</strong></div>
                <div className={styles.detailRow}><span>Vencimiento</span><strong>{selected.cardExpiry}</strong></div>
                <div className={styles.detailRow}><span>Total cobrado</span><strong style={{color:'#2ecc71'}}>{formatCurrency(selected.totalAmount)}</strong></div>
              </div>
              <div className={styles.detailSection}>
                <h4>Informacion</h4>
                <div className={styles.detailRow}><span>ID</span><strong className={styles.mono}>{selected.id}</strong></div>
                <div className={styles.detailRow}><span>Estado</span>
                  <span className={`badge ${selected.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>
                    {selected.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
                <div className={styles.detailRow}><span>Fecha compra</span><strong>{new Date(selected.createdAt).toLocaleString('es-AR')}</strong></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
