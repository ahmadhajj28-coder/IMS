import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative("Price must be >= 0"),
  quantity: z.coerce.number().int().nonnegative("Quantity must be >= 0"),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .nonnegative("Low-stock threshold must be >= 0"),
});

export const lotSchema = z.object({
  lotNumber: z.string().trim().min(1, "Lot number is required"),
  expiryDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  quantity: z.coerce.number().int().nonnegative("Quantity must be >= 0"),
});

export const stockMovementSchema = z.object({
  productId: z.coerce.number().int().positive(),
  lotId: z.coerce.number().int().optional(),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.coerce.number().int().nonnegative("Quantity must be >= 0"),
  reason: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  movementDate: z.string().trim().optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export const reorderRuleSchema = z
  .object({
    productId: z.coerce.number().int().positive("Select a product"),
    minStock: z.coerce.number().int().nonnegative("Min stock must be >= 0"),
    maxStock: z.coerce.number().int().positive("Max stock must be >= 1"),
    reorderQty: z.coerce.number().int().positive("Reorder qty must be >= 1"),
    supplierId: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine((data) => data.minStock < data.maxStock, {
    message: "Min stock must be less than max stock",
    path: ["maxStock"],
  });

