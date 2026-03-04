import { PurchaseData } from '../types';

const STORAGE_KEY = 'movistar_arena_purchases';

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

export function detectCardType(number: string): 'visa' | 'mastercard' | 'unknown' {
  const clean = number.replace(/\s/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
  return 'unknown';
}

export function formatCurrency(amount: number): string {
  return '$ ' + amount.toLocaleString('es-AR');
}

export function maskCard(number: string): string {
  const clean = number.replace(/\s/g, '');
  return '**** **** **** ' + clean.slice(-4);
}
