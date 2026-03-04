export interface Show {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  extraDates?: string;
  price: number;
  priceLabel: string;
  puertas: string;
  showTime: string;
  sold: boolean;
  targetDate: string;
  bgGradient: string;
  textColor: string;
  category: string;
  about: string;
  image?: string;
}

export interface PurchaseData {
  id: string;
  showId: string;
  showTitle: string;
  showDate: string;
  quantity: number;
  section: string;
  totalAmount: number;
  cardNumber: string;
  cardHolder: string;
  cardType: 'visa' | 'mastercard' | 'unknown';
  cardExpiry: string;
  dni: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface CartItem {
  showId: string;
  showTitle: string;
  showDate: string;
  quantity: number;
  section: string;
  pricePerUnit: number;
}
