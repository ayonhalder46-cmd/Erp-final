
import { Product, Customer, Sale, Supplier, Expense, Return } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'FUR-001',
    name: 'Mid-Century Velvet Armchair',
    category: 'Furniture',
    costPrice: 12000,
    sellingPrice: 24500,
    stockLevel: 12,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'LGT-052',
    name: 'Industrial Copper Pendant Light',
    category: 'Lighting',
    costPrice: 3500,
    sellingPrice: 7800,
    stockLevel: 25,
    hasVariants: true,
    variants: [
      { id: 'v1', sku: 'LGT-052-CP', name: 'Polished Copper', costPrice: 3500, sellingPrice: 7800, stockLevel: 15 },
      { id: 'v2', sku: 'LGT-052-BK', name: 'Matte Black', costPrice: 3200, sellingPrice: 7200, stockLevel: 10 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'TEX-882',
    name: 'Handwoven Jute Runner',
    category: 'Textiles',
    costPrice: 1800,
    sellingPrice: 4200,
    stockLevel: 40,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'SHW-109',
    name: 'Abstract Marble Sculpture',
    category: 'Showpiece',
    costPrice: 8500,
    sellingPrice: 16000,
    stockLevel: 5,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    sku: 'WLD-303',
    name: 'Minimalist Oak Mirror',
    category: 'Wall Decor',
    costPrice: 5000,
    sellingPrice: 11500,
    stockLevel: 18,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    sku: 'KIT-221',
    name: 'Ceramic Pour-Over Set',
    category: 'Kitchenware',
    costPrice: 1200,
    sellingPrice: 3500,
    stockLevel: 30,
    hasVariants: true,
    variants: [
      { id: 'v3', sku: 'KIT-221-WH', name: 'Alabaster White', costPrice: 1200, sellingPrice: 3500, stockLevel: 20 },
      { id: 'v4', sku: 'KIT-221-GY', name: 'Slate Grey', costPrice: 1200, sellingPrice: 3500, stockLevel: 10 }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    sku: 'GDN-401',
    name: 'Terracotta Self-Watering Pot',
    category: 'Garden',
    costPrice: 800,
    sellingPrice: 1950,
    stockLevel: 55,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    sku: 'ACC-505',
    name: 'Brass Incense Holder',
    category: 'Accessories',
    costPrice: 600,
    sellingPrice: 1450,
    stockLevel: 100,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '9',
    sku: 'FUR-102',
    name: 'Teak Wood Coffee Table',
    category: 'Furniture',
    costPrice: 15000,
    sellingPrice: 32000,
    stockLevel: 8,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  },
  {
    id: '10',
    sku: 'WLD-404',
    name: 'Framed Botanical Sketch',
    category: 'Wall Decor',
    costPrice: 2200,
    sellingPrice: 5800,
    stockLevel: 15,
    hasVariants: false,
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Anisur Rahman',
    address: 'House 42, Road 12, Dhanmondi, Dhaka',
    phone: '01711223344',
    totalSpent: 45000,
    lastPurchaseDate: '2024-03-15',
    tier: 'Silver'
  },
  {
    id: 'c2',
    name: 'Farhana Yasmin',
    address: 'Flat 4B, Sheltech Tower, Banani, Dhaka',
    phone: '01822334455',
    totalSpent: 125000,
    lastPurchaseDate: '2024-05-10',
    tier: 'Gold'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'Bengal Artisan Collective',
    contactPerson: 'Zakir Hossain',
    email: 'info@bengalartisan.com',
    phone: '01911002233',
    category: 'Furniture',
    status: 'Active'
  },
  {
    id: 's2',
    name: 'Luminous Imports',
    contactPerson: 'Mehedi Hasan',
    email: 'sales@luminous.com',
    phone: '01511998877',
    category: 'Lighting',
    status: 'Active'
  }
];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: new Date().toISOString(),
    category: 'Rent',
    description: 'Showroom Monthly Rent',
    amount: 150000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid'
  }
];

export const INITIAL_RETURNS: Return[] = [];
