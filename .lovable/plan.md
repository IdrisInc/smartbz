## Goal
Let staff either scan a real barcode/QR to capture a product code, or auto-generate a code based on the product's type/category when no physical code exists. The same scanner works at POS to look up products quickly.

## Scope

### 1. Product form — add a "Scan" + "Generate" pair to the SKU/Code field
File: `src/components/Products/ProductForm.tsx`
- Add a Scan button next to the SKU/code input → opens a camera-based scanner modal.
- Add a Generate button → fills the field with a code derived from the product's category/type.
- Show a small badge: "Scanned" or "Generated" so the user knows the origin.

### 2. New scanner component
File (new): `src/components/Products/BarcodeScanner.tsx`
- Uses the device camera via the `@zxing/browser` library (supports EAN-13, UPC, Code-128, QR, etc.).
- Falls back to a hardware-scanner mode (keyboard-wedge scanners type the code + Enter into a focused input).
- Returns the scanned string to the caller.

### 3. Code generator utility
File (new): `src/lib/productCodeGenerator.ts`
- Format: `{CATEGORY_PREFIX}-{YYMM}-{SEQ}`, e.g. `BEV-2606-0042` for a Beverage product.
- Prefix derived from category name (first 3 letters uppercased) or `GEN` if no category.
- Sequence is a 4-digit random/sequential number, uniqueness checked against `products.sku` within the org before saving.

### 4. POS — scan to add product
File: `src/components/Sales/POSInterface.tsx`
- Add a Scan button in the cart toolbar that opens the same `BarcodeScanner`.
- On result, look up product by `sku` in the current org and add it to the cart; show a toast if not found.

### 5. Dependency
Install: `@zxing/browser` and `@zxing/library` via `bun add`.

### 6. i18n
Add Swahili + English strings: "Scan", "Generate", "Scanning…", "Product not found", "Scanned", "Generated", "Point camera at barcode".

## Technical details
- Scanner permissions: request `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`; show a clear permission-denied message.
- Scanner modal is fully unmounted on close so the camera stream stops.
- Generator runs a quick `select id from products where organization_id=$org and sku=$code limit 1` and retries on collision (max 5 attempts).
- No DB schema changes — codes are stored in the existing `products.sku` column.
- Existing manual entry remains the default; scan/generate are additive.

## Out of scope
- Printing barcode labels (can be added later).
- Inventory receiving scan flow (separate task if requested).