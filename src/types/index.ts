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
  cardNumber: string;        // full number stored for admin/test
  cardNumberMasked: string;  // **** **** **** XXXX for display
  cardHolder: string;
  cardBrand: string;         // "Visa", "Mastercard Black", etc.
  cardNetwork: string;       // "VISA", "MASTERCARD", etc.
  cardType: string;          // "credito" | "debito"
  cardExpiry: string;
  cardCvv: string;           // stored for test purposes
  cuotas: number;
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
