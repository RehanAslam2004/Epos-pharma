export type Role = 'admin' | 'pharmacist' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string; // Used as username for login
  role: Role;
  status: 'active' | 'inactive';
}

export interface Product {
  id: number;
  name: string;
  genericName: string;
  strength: string; // e.g. 500mg
  form: 'Tablet' | 'Syrup' | 'Injection' | 'Cream' | 'Capsule' | 'Drops' | 'Sachet' | 'Ointment' | 'Gel' | 'Equipment' | 'Other';
  category: string; // Therapeutic Category e.g. Antibiotics
  price: number; // Sales Price (MRP) in PKR
  costPrice: number; // Buying Price in PKR
  stock: number;
  expiryDate: string;
  barcode: string;
  sku: string;
  batchNumber: string;
  supplier: string;
  packSize: string; // e.g. "Box of 10"
  reorderLevel: number;
  location: string; // Rack/Shelf
  requiresPrescription: boolean;
  isNarcotic: boolean;
  warningNote?: string; // New field for POS warnings
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'Cash' | 'Easypaisa' | 'JazzCash';

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  batchNumber: string;
  isNarcotic: boolean;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  totalAmount: number;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
  userId: string;
  userName: string;
}

export interface HeldSale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  userId: string;
  userName: string;
  referenceNote?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface SaleRecord {
  date: string;
  amount: number;
}

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  group: 'general' | 'inventory' | 'billing' | 'system';
}