## Goal
Enable serialized inventory for products like phones — each physical unit tracked by IMEI/serial. Add scanning to **Inventory Receive**, **Stock Audit**, and **POS**, with smart URL parsing to auto-extract IMEI/SN from QR codes and prompts to scan any missing fields.

## Concept clarification
You are right — the **catalog** (Products) defines *what an item is*, and **Inventory** tracks *physical units in stock*. Scanning IMEIs belongs in Inventory (on receive) and POS (on sale), not on the product form. The catalog just marks a product as "serialized" so the system knows to demand IMEI/SN for every unit.

## Scope

### 1. Database — new `product_units` table
Tracks each physical unit:
- `product_id`, `organization_id`, `branch_id`
- `imei`, `serial_number`, `barcode` (all nullable, at least one required)
- `status`: `in_stock` | `sold` | `returned` | `damaged` | `lost`
- `received_at`, `sold_at`, `sale_id` (nullable), `purchase_order_id` (nullable)
- `notes`, `created_by_name`, standard timestamps
- Unique indexes on `(organization_id, imei)` and `(organization_id, serial_number)` (where not null)
- Full GRANTs + RLS scoped to `organization_memberships`

Also add `is_serialized boolean default false` to `products` to flag which catalog items require IMEI/SN capture.

### 2. Scanner enhancements — `BarcodeScanner.tsx`
- Add a `parseScanned(raw)` helper that recognises:
  - Bare 15-digit numeric → **IMEI**
  - URL with `imei=`, `sn=`, `serial=`, `serialNumber=` query params → extract each
  - URL path segments matching IMEI/SN patterns
  - Otherwise → raw string (barcode/SKU)
- Return a structured result `{ raw, imei?, serial?, url?, kind: 'imei'|'serial'|'url'|'unknown' }` alongside the existing string callback (via a new optional `onDetectedStructured` prop, keeping current callers working).
- After a scan, if `is_serialized` product and any required field is missing, show a "Scan next" prompt in the dialog for the missing field before closing.

### 3. Inventory Receive flow — new component
File (new): `src/components/Inventory/ReceiveUnitsDialog.tsx`
- Opened from an existing Purchase Order (or a standalone "Receive stock" button in Inventory).
- Pick product → if serialized, opens scanner in **repeating mode**: scan one unit → capture IMEI + SN → save row → immediately re-open scanner for next unit. Live counter "3 of 10 received".
- On finish, inserts N rows into `product_units` and bumps `products.stock_quantity` by N via existing trigger pattern.

### 4. Stock Audit flow
File: `src/components/Inventory/StockAuditLog.tsx` (extend)
- Add "Scan to verify" button that opens scanner in repeating mode, ticks off units whose IMEI/SN exist in `product_units` with status `in_stock`, and flags unknown scans as discrepancies. Produces a report of missing / extra / matched.

### 5. POS — scan IMEI to sell serialized unit
File: `src/components/Sales/POSInterface.tsx` (already has scan button)
- When scan result is an IMEI/SN, look up the matching `product_units` row (status `in_stock`) → add its product to cart and attach the unit id to the cart line.
- On sale confirm: update those `product_units` rows to `status='sold'`, `sale_id`, `sold_at`.
- If scanned code matches a product SKU (non-serialized product), keep existing behaviour.

### 6. Product form
File: `src/components/Products/ProductForm.tsx`
- Add a simple checkbox: **"This product has unique IMEI/serial numbers per unit"** → sets `is_serialized`.
- Remove per-unit scanning here (belongs in Inventory).

### 7. i18n
Add EN + SW strings: "Receive units", "Scan next unit", "IMEI captured", "Serial captured", "Unit already in stock", "Unknown unit — not in inventory", "Serialized product", "3 of 10 received".

## Technical details
- Structured scan parser lives in `src/lib/scanParser.ts` — pure function, unit-testable.
- IMEI regex: `/\b\d{15}\b/`. Query params checked case-insensitively.
- Scanner "repeating mode" prop keeps camera open after a hit, shows the captured value for 800 ms, then resumes decoding.
- Uniqueness enforced at DB level (partial unique indexes) so two receives of the same IMEI fail cleanly.
- All inserts include `created_by_name` per accountability rule.
- Notifications fire on receive completion and on any audit discrepancy.

## Out of scope
- Warranty period tracking (can extend `product_units` later).
- Bulk import of IMEIs from CSV.
- Label printing.

## Files touched
- migration: new `product_units`, `products.is_serialized`
- new: `src/lib/scanParser.ts`
- new: `src/components/Inventory/ReceiveUnitsDialog.tsx`
- edit: `src/components/Products/BarcodeScanner.tsx` (structured result + repeating mode)
- edit: `src/components/Products/ProductForm.tsx` (is_serialized checkbox, remove scan-per-unit)
- edit: `src/components/Sales/POSInterface.tsx` (IMEI lookup path)
- edit: `src/components/Inventory/StockAuditLog.tsx` (scan-to-verify)
- edit: `src/pages/Inventory.tsx` (entry point for ReceiveUnitsDialog)
- edit: `src/i18n/translations.ts`
