
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockLevel: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplierId?: string; // Link to Supplier ID
  costPrice: number;
  sellingPrice: number;
  stockLevel: number;
  hasVariants: boolean;
  variants?: ProductVariant[];
  image?: string; // Base64 or URL
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  totalSpent: number;
  lastPurchaseDate: string;
  tier: 'Gold' | 'Silver' | 'Bronze' | 'VIP';
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  status: 'Active' | 'Inactive';
  updatedAt?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  totalCost: number;
  profit: number;
  notes: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  updatedAt?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Logistics' | 'Maintenance' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Mobile Banking';
  status: 'Paid' | 'Pending';
  updatedAt?: string;
}

export interface Return {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  customerName: string;
  productName: string;
  quantity: number;
  unitCost?: number; // Captured to calculate asset recovery value
  refundAmount: number;
  reason: 'Defective' | 'Wrong Item' | 'Changed Mind' | 'Other';
  condition: 'Resellable' | 'Damaged';
  status: 'Approved' | 'Rejected' | 'Pending';
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'system';
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
  topProduct: string;
}

export interface PeriodSummary {
  month: string; // Format: "YYYY-MM"
  openingInventoryValue: number;
  closingInventoryValue: number;
  openingBalance: number; // Cash/Bank start
  closingBalance: number; // Cash/Bank end
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  closedAt: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

export type ViewState = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'suppliers' | 'expenses' | 'returns' | 'calculator' | 'reports' | 'advisor' | 'audit' | 'settings' | 'tester' | 'spreadsheet';
