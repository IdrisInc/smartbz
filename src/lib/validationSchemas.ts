import { z } from 'zod';

// Sale item validation
export const saleItemSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  productName: z.string().min(1, 'Product name required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be non-negative'),
  total: z.number().nonnegative(),
});

// Sale creation validation
export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'mobile_money', 'bank_transfer', 'check']),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total must be positive'),
  notes: z.string().max(500).optional(),
});

// Expense validation
export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string().optional(),
  expenseDate: z.date(),
});

// Invoice validation
export const createInvoiceSchema = z.object({
  contactId: z.string().uuid('Select a valid contact'),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1, 'At least one item is required'),
});

// Contact validation
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  contactType: z.enum(['customer', 'supplier', 'both']).default('customer'),
});

// Product validation
export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  sku: z.string().max(50).optional().or(z.literal('')),
  price: z.number().nonnegative('Price must be non-negative'),
  cost_price: z.number().nonnegative('Cost price must be non-negative').optional(),
  stock_quantity: z.number().int().nonnegative('Stock cannot be negative'),
  min_stock_level: z.number().int().nonnegative().optional(),
  description: z.string().max(1000).optional().or(z.literal('')),
});

// Stock adjustment validation
export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Select a product'),
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

// Rejection reason validation
export const rejectionSchema = z.object({
  reason: z.string().min(3, 'Please provide a reason (min 3 characters)').max(500),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProductInput = z.infer<typeof productSchema>;
