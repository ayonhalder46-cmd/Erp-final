
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockLevel: number;
  minStockLevel?: number; // New: Reorder point for variants
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
  minStockLevel?: number; // New: Reorder point
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
  deliveryCharge?: number; // DEPRECATED: Kept optional for legacy data compatibility
  totalAmount: number;
  totalCost: number;
  profit: number;
  notes?: string;
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money' | 'Bank Transfer' | 'Other'; 
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Returned' | 'Partially Returned' | 'Cancelled';
  isDelivered?: boolean; // Deprecated, kept for backward compat
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  status: 'Paid' | 'Pending';
  referenceId?: string;
}

export interface Return {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
  refundAmount: number;
  reason: 'Defective' | 'Wrong Item' | 'Changed Mind' | 'Other';
  condition: 'Resellable' | 'Damaged';
  status: 'Pending' | 'Approved' | 'Rejected';
  isDeliveryRefused?: boolean; 
  deliveryLossAmount?: number; 
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

export type ViewState = 
  | 'dashboard' 
  | 'inventory' 
  | 'sales' 
  | 'customers' 
  | 'suppliers' 
  | 'expenses' 
  | 'returns' 
  | 'reports' 
  | 'calculator' 
  | 'tester' 
  | 'settings' 
  | 'advisor' 
  | 'audit'
  | 'spreadsheet'
  | 'procurement';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  expectedDate: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Ordered' | 'Received' | 'Cancelled';
  notes?: string;
}

export interface MonthlyReport {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
  topProduct: string;
}

export interface PeriodSummary {
  month: string;
  openingInventoryValue: number;
  closingInventoryValue: number;
  openingBalance: number;
  closingBalance: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  closedAt: string;
}
