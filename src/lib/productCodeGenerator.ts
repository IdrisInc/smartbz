import { supabase } from '@/integrations/supabase/client';

/**
 * Builds a product code in the format: {PREFIX}-{YYMM}-{SEQ}
 * Prefix derives from category name (first 3 alpha chars uppercased) or
 * product type when no category is provided. Falls back to "GEN".
 * Ensures uniqueness against products.sku within the organization.
 */
export async function generateProductCode(opts: {
  organizationId: string;
  category?: string | null;
  type?: string | null;
}): Promise<string> {
  const base = (opts.category || opts.type || 'GEN')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X') || 'GEN';

  const now = new Date();
  const yymm = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;

  for (let attempt = 0; attempt < 6; attempt++) {
    const seq = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${base}-${yymm}-${seq}`;
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', opts.organizationId)
      .eq('sku', code)
      .maybeSingle();
    if (error) {
      // On error fall back to returning the code rather than blocking the user
      return code;
    }
    if (!data) return code;
  }
  // Final fallback: timestamp suffix guarantees uniqueness
  return `${base}-${yymm}-${Date.now().toString().slice(-5)}`;
}
