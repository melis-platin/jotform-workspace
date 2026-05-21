// ============================================
// Product List — variant data model + pure helpers
// ============================================

export type ProductListLayout = 'ThreeColumns' | 'TwoColumns' | 'SingleColumn';

export interface ProductOptionDimension {
  /** Unique id — a stable React-key handle. */
  id: string;
  /** Human label shown to the buyer, e.g. "Size". */
  label: string;
  /** Possible values, e.g. ["S", "M", "L"]. */
  values: string[];
  /** How the option renders for the buyer. */
  type?: 'text' | 'color';
}

export interface ProductVariant {
  /** Deterministic id — stable across edits so stock/price references survive. */
  id: string;
  /** Selected value per dimension label, e.g. { Size: "M", Color: "Red" }. */
  optionValues: Record<string, string>;
}

/** Field types a buyer-facing modifier can render as. */
export type ProductModifierFieldType = 'text' | 'color' | 'textbox';

/** A buyer-facing customization that doesn't affect price or inventory. */
export interface ProductModifier {
  id: string;
  name: string;
  fieldType: ProductModifierFieldType;
  required: boolean;
}

/** Billing interval unit for a subscription plan. */
export type ProductSubscriptionRepeatUnit = 'day' | 'week' | 'month' | 'year';

/** A recurring-payment plan attached to a product. */
export interface ProductSubscription {
  name: string;
  tagline?: string;
  /** Interval count between charges, paired with repeatUnit (e.g. every 2 weeks). */
  repeatEvery: number;
  repeatUnit: ProductSubscriptionRepeatUnit;
  /** Total billing cycles before the plan ends; 0 = never expires. */
  expiresAfterCycles: number;
  /** Discount applied to the product price. */
  discount: number;
  /** Whether the discount is a flat currency amount or a percentage. */
  discountType: 'amount' | 'percent';
}

export interface ProductItem {
  /** Optional — lazily assigned when the product is edited (backward compat). */
  id?: string;
  name: string;
  /** Kept as a string: inline-edit UX is currency-prefix string-native. */
  price: string;
  description?: string;
  image?: string;
  /** Variant dimensions defined by the seller (max 3). */
  optionDimensions?: ProductOptionDimension[];
  /** Auto-generated cartesian product of optionDimensions. */
  variants?: ProductVariant[];
  /** Customization options that don't affect price or inventory. */
  modifiers?: ProductModifier[];
  /** Recurring-payment plan for this product. */
  subscription?: ProductSubscription;
}

/** Max variant dimensions per product (e-commerce convention: Size/Color/Material). */
export const MAX_DIMENSIONS = 3;
/** Soft cap on values per dimension — surfaces a warning past this. */
export const MAX_VALUES_PER_DIMENSION = 20;

/** Lowercase, hyphen-joined slug for stable ids. */
export function slug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let dimensionIdCounter = 0;

/** Unique dimension id — a stable React-key handle, independent of the label. */
export function makeDimensionId(): string {
  return `dim_${Date.now().toString(36)}_${(dimensionIdCounter++).toString(36)}`;
}

/**
 * Deterministic variant id from its option values. Keys are sorted so the id
 * is identical regardless of dimension order — Phase 2 stock references rely
 * on this stability.
 */
export function buildVariantId(optionValues: Record<string, string>): string {
  const parts = Object.keys(optionValues)
    .sort()
    .map((key) => `${slug(key)}-${slug(optionValues[key])}`);
  return `v_${parts.join('_')}`;
}

/**
 * Cartesian product of all dimensions that have a label and at least one
 * value. Dimensions still being filled in are skipped so no garbage variants
 * are produced.
 */
export function generateVariants(dimensions: ProductOptionDimension[]): ProductVariant[] {
  const active = dimensions.filter((d) => d.label.trim() !== '' && d.values.length > 0);
  if (active.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const dimension of active) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const value of dimension.values) {
        next.push({ ...combo, [dimension.label]: value });
      }
    }
    combos = next;
  }

  return combos.map((optionValues) => ({ id: buildVariantId(optionValues), optionValues }));
}

/** Compact buyer-facing variant label, e.g. "M / Red". */
export function variantLabel(optionValues: Record<string, string>): string {
  return Object.values(optionValues).join(' / ');
}

let productIdCounter = 0;

/** Unique, one-time product id — stable once assigned. */
export function makeProductId(): string {
  return `p_${Date.now().toString(36)}_${(productIdCounter++).toString(36)}`;
}

/**
 * Lazily assigns ids to products that lack one. Returns a new array only when
 * something changed, so callers can skip redundant writes.
 */
export function ensureProductIds(products: ProductItem[]): ProductItem[] {
  let changed = false;
  const next = products.map((product) => {
    if (product.id) return product;
    changed = true;
    return { ...product, id: makeProductId() };
  });
  return changed ? next : products;
}
