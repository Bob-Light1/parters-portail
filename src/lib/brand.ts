/**
 * @file brand.ts
 * @description Deployment product identity with compatible establishment overrides.
 */

/** Only allow public asset URLs and local application paths. */
function assetUrl(value: string | undefined): string {
  const input = (value || '').trim();
  if (/^\/(?!\/)/.test(input)) return input;
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_BRAND_NAME?.trim() || 'Wewigo';
const establishment = process.env.NEXT_PUBLIC_BRAND_NAME?.trim();
export const BRAND_NAME = establishment || PRODUCT_NAME;
export const BRAND_LOGO = assetUrl(process.env.NEXT_PUBLIC_BRAND_LOGO_URL)
  || (!establishment ? assetUrl(process.env.NEXT_PUBLIC_PRODUCT_BRAND_LOGO_URL) : '');
export const BRAND_ICON = assetUrl(process.env.NEXT_PUBLIC_BRAND_ICON_URL)
  || (!establishment ? assetUrl(process.env.NEXT_PUBLIC_PRODUCT_BRAND_ICON_URL) : '');
