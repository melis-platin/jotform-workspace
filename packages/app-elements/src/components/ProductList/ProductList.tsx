import { useState, useEffect, type FC } from 'react';
import { Icon } from '../Icon/Icon';
import { Button } from '../Button';
import { useCart } from '../../runtime/CartContext';
import { useFavorites } from '../../runtime/FavoritesContext';
import { buildVariantId, variantLabel, type ProductItem, type ProductListLayout, type ProductOptionDimension } from './types';
import './ProductList.scss';

export type {
  ProductItem,
  ProductListLayout,
  ProductOptionDimension,
  ProductVariant,
} from './types';

export interface ProductListProps {
  layout?: ProductListLayout;
  title?: string;
  subtitle?: string;
  currency?: string;
  showToolbar?: boolean;
  showImages?: boolean;
  enableVariants?: boolean;
  searchPlaceholder?: string;
  buttonLabel?: string;
  selected?: boolean;
  shrinked?: boolean;
  products?: ProductItem[];
  showAddNew?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
  onProductsChange?: (products: ProductItem[]) => void;
}

// ============================================
// Image Placeholder
// ============================================
const ImagePlaceholder: FC<{ size?: number }> = ({ size = 80 }) => (
  <Icon name="Image" size={size} />
);

// ============================================
// Inline edit helpers
// ============================================
function handleEditFocus(e: React.FocusEvent<HTMLElement>, defaultValue: string) {
  if (e.currentTarget.textContent === defaultValue) {
    e.currentTarget.textContent = ''
    e.currentTarget.dataset.placeholder = defaultValue
    e.currentTarget.classList.add('jf-product-item__placeholder')
  }
}

function handleEditInput(e: React.FormEvent<HTMLElement>) {
  if (e.currentTarget.textContent) {
    e.currentTarget.classList.remove('jf-product-item__placeholder')
  } else {
    e.currentTarget.classList.add('jf-product-item__placeholder')
  }
}

function handleEditBlur(e: React.FocusEvent<HTMLElement>, defaultValue: string, onUpdate: (val: string) => void) {
  const text = e.currentTarget.textContent || ''
  e.currentTarget.classList.remove('jf-product-item__placeholder')
  delete e.currentTarget.dataset.placeholder
  if (text) {
    onUpdate(text)
  } else {
    e.currentTarget.textContent = defaultValue
    onUpdate(defaultValue)
  }
}

// ============================================
// Variant Selectors — one dropdown per dimension
// ============================================
const VariantSelectors: FC<{
  dimensions: ProductOptionDimension[];
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}> = ({ dimensions, selected, onChange }) => (
  <div className="jf-product-item__variants">
    {dimensions.map((dim) => (
      <select
        key={dim.id}
        className="jf-product-item__variant-select"
        value={selected[dim.label] ?? ''}
        onChange={(e) => onChange({ ...selected, [dim.label]: e.target.value })}
        aria-label={dim.label}
      >
        <option value="" disabled>{`Select ${dim.label}`}</option>
        {dim.values.map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
    ))}
  </div>
);

/** Resolves the variant selection state shared by both item layouts. */
function useVariantSelection(product: ProductItem, enableVariants: boolean) {
  const dimensions = enableVariants ? (product.optionDimensions ?? []) : [];
  const hasVariants = dimensions.length > 0;
  const [selected, setSelected] = useState<Record<string, string>>({});
  const allSelected = dimensions.every((dim) => selected[dim.label]);
  const variantId = hasVariants && allSelected ? buildVariantId(selected) : undefined;
  const variantText = hasVariants && allSelected ? variantLabel(selected) : undefined;
  return { dimensions, hasVariants, selected, setSelected, allSelected, variantId, variantText };
}

// ============================================
// Card Item (used in 2/3 column layouts)
// ============================================
const ProductCardItem: FC<{ product: ProductItem; buttonLabel: string; currency: string; showImages: boolean; enableVariants: boolean; onUpdate?: (updates: Partial<ProductItem>) => void }> = ({
  product,
  buttonLabel,
  currency,
  showImages,
  enableVariants,
  onUpdate,
}) => {
  const cart = useCart();
  const favorites = useFavorites();
  const { dimensions, hasVariants, selected, setSelected, allSelected, variantId, variantText } = useVariantSelection(product, enableVariants);
  const inCart = hasVariants
    ? allSelected && (cart?.has(product.name, variantId) ?? false)
    : cart?.has(product.name) ?? false;
  const liked = favorites?.has(product.name) ?? false;
  const addDisabled = inCart || (hasVariants && !allSelected);
  const handleAdd = () => cart?.add({ name: product.name, price: product.price, image: product.image, variantId, variantLabel: variantText });
  const toggleLike = () => favorites?.toggle({ name: product.name, price: product.price, image: product.image });
  return (
  <div className="jf-product-item jf-product-item--card">
    {showImages && (
      <div className="jf-product-item__image">
        {product.image ? <img src={product.image} alt={product.name} className="jf-product-item__img" /> : <ImagePlaceholder />}
        <button className={`jf-product-item__like${liked ? ' liked' : ''}`} onClick={toggleLike}>
          <Icon name="Heart" size={18} forceStyle={liked ? 'fill' : 'outline'} />
        </button>
      </div>
    )}
    <div className="jf-product-item__content">
      <div className="jf-product-item__info">
        <p
          className="jf-product-item__name"
          contentEditable
          suppressContentEditableWarning
          onFocus={(e) => handleEditFocus(e, 'Product Name')}
          onInput={handleEditInput}
          onBlur={(e) => handleEditBlur(e, 'Product Name', (val) => onUpdate?.({ name: val }))}
        >
          {product.name}
        </p>
        <p className="jf-product-item__price">
          <span className="jf-product-item__currency">{currency}</span>
          <span
            className="jf-product-item__amount"
            contentEditable
            suppressContentEditableWarning
            onFocus={(e) => handleEditFocus(e, '10.00')}
            onInput={handleEditInput}
            onBlur={(e) => handleEditBlur(e, '10.00', (val) => onUpdate?.({ price: val }))}
          >
            {product.price}
          </span>
        </p>
      </div>
      {hasVariants && <VariantSelectors dimensions={dimensions} selected={selected} onChange={setSelected} />}
      <div className="jf-product-item__action">
        <Button
          variant="Default"
          state={addDisabled ? 'Disabled' : 'Default'}
          corner="Default"
          size="Small"
          label={inCart ? 'Added to Cart' : buttonLabel}
          leftIcon="none"
          rightIcon="none"
          fullWidth
          shrinked
          onClick={addDisabled ? undefined : handleAdd}
        />
      </div>
    </div>
  </div>
  );
};

// ============================================
// Basic Item (used in single column layout)
// ============================================
const ProductBasicItem: FC<{ product: ProductItem; buttonLabel: string; currency: string; showImages: boolean; enableVariants: boolean; onUpdate?: (updates: Partial<ProductItem>) => void }> = ({
  product,
  buttonLabel,
  currency,
  showImages,
  enableVariants,
  onUpdate,
}) => {
  const cart = useCart();
  const favorites = useFavorites();
  const { dimensions, hasVariants, selected, setSelected, allSelected, variantId, variantText } = useVariantSelection(product, enableVariants);
  const inCart = hasVariants
    ? allSelected && (cart?.has(product.name, variantId) ?? false)
    : cart?.has(product.name) ?? false;
  const liked = favorites?.has(product.name) ?? false;
  const addDisabled = inCart || (hasVariants && !allSelected);
  const handleAdd = () => cart?.add({ name: product.name, price: product.price, image: product.image, variantId, variantLabel: variantText });
  const toggleLike = () => favorites?.toggle({ name: product.name, price: product.price, image: product.image });
  return (
  <div className={`jf-product-item jf-product-item--basic${hasVariants ? ' jf-product-item--has-variants' : ''}`}>
    {showImages && (
      <div className="jf-product-item__image-basic">
        {product.image ? <img src={product.image} alt={product.name} className="jf-product-item__img" /> : <ImagePlaceholder size={56} />}
      </div>
    )}
    <div className="jf-product-item__body">
      <div className="jf-product-item__info">
        <p
          className="jf-product-item__name"
          contentEditable
          suppressContentEditableWarning
          onFocus={(e) => handleEditFocus(e, 'Product Name')}
          onInput={handleEditInput}
          onBlur={(e) => handleEditBlur(e, 'Product Name', (val) => onUpdate?.({ name: val }))}
        >
          {product.name}
        </p>
        <p className="jf-product-item__price">
          <span className="jf-product-item__currency">{currency}</span>
          <span
            className="jf-product-item__amount"
            contentEditable
            suppressContentEditableWarning
            onFocus={(e) => handleEditFocus(e, '10.00')}
            onInput={handleEditInput}
            onBlur={(e) => handleEditBlur(e, '10.00', (val) => onUpdate?.({ price: val }))}
          >
            {product.price}
          </span>
        </p>
        {hasVariants && <VariantSelectors dimensions={dimensions} selected={selected} onChange={setSelected} />}
      </div>
      <div className="jf-product-item__right">
        <button className={`jf-product-item__like jf-product-item__like--inline${liked ? ' liked' : ''}`} onClick={toggleLike}>
          <Icon name="Heart" size={24} forceStyle={liked ? 'fill' : 'outline'} />
        </button>
        <Button
          variant="Default"
          state={addDisabled ? 'Disabled' : 'Default'}
          corner="Default"
          size="Small"
          label={inCart ? 'Added to Cart' : buttonLabel}
          leftIcon="none"
          rightIcon="none"
          shrinked
          onClick={addDisabled ? undefined : handleAdd}
        />
      </div>
    </div>
  </div>
  );
};

// ============================================
// Add New Product Card
// ============================================
const AddNewProductCard: FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div className="jf-product-item jf-product-item--add-new" onClick={onClick}>
    <Icon name="CirclePlus" size={40} />
    <span className="jf-product-item__add-label">Add New Product</span>
  </div>
);

// ============================================
// Add New Product Basic (single column)
// ============================================
const AddNewProductBasic: FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div className="jf-product-item jf-product-item--add-new jf-product-item--add-new-basic" onClick={onClick}>
    <Icon name="CirclePlus" size={28} />
    <span className="jf-product-item__add-label">Add New Product</span>
  </div>
);

// ============================================
// Layout Switch Icons
// ============================================
const LAYOUT_ICONS: { layout: ProductListLayout; iconName: string }[] = [
  { layout: 'SingleColumn', iconName: 'List' },
  { layout: 'TwoColumns', iconName: 'Grid2x2' },
  { layout: 'ThreeColumns', iconName: 'Grid3x3' },
];

// ============================================
// Product List Component
// ============================================
const DEFAULT_PRODUCTS: ProductItem[] = [
  { name: 'Product Name', price: '10.00' },
];

// ============================================
// Skeleton Card Item
// ============================================
const SkeletonProductCard: FC<{ animClass: string; showImages: boolean }> = ({ animClass, showImages }) => (
  <div className={`jf-product-item jf-product-item--card ${animClass}`}>
    {showImages && <div className="jf-product-item__image jf-skeleton__bone" />}
    <div className="jf-product-item__content" style={{ background: 'var(--bg-surface)' }}>
      <div className="jf-product-item__info">
        <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--md" />
        <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--sm" />
      </div>
      <div className="jf-product-item__action">
        <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--lg" />
      </div>
    </div>
  </div>
);

// ============================================
// Skeleton Basic Item (single column)
// ============================================
const SkeletonProductBasic: FC<{ animClass: string; showImages: boolean }> = ({ animClass, showImages }) => (
  <div className={`jf-product-item jf-product-item--basic ${animClass}`}>
    {showImages && <div className="jf-product-item__image-basic jf-skeleton__bone" />}
    <div className="jf-product-item__body" style={{ background: 'var(--bg-surface)' }}>
      <div className="jf-product-item__info">
        <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--md" />
        <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--sm" />
      </div>
      <div className="jf-product-item__right">
        <div className="jf-skeleton__bone" style={{ width: 80, height: 32, borderRadius: 6 }} />
      </div>
    </div>
  </div>
);

export const ProductList: FC<ProductListProps> = ({
  layout: initialLayout = 'TwoColumns',
  title = 'Products',
  subtitle = '',
  currency = '$',
  showToolbar = true,
  showImages = true,
  enableVariants = false,
  searchPlaceholder = 'Search Products',
  buttonLabel = 'Add to Cart',
  selected = false,
  shrinked = false,
  products = DEFAULT_PRODUCTS,
  showAddNew = true,
  skeleton = false,
  skeletonAnimation = 'pulse',
  onProductsChange,
}) => {
  const [layout, setLayout] = useState<ProductListLayout>(initialLayout);

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  const handleAddProduct = () => {
    onProductsChange?.([...products, { name: 'Product Name', price: '10.00' }]);
  };

  const isSingle = layout === 'SingleColumn';

  const rootClasses = [
    'jf-product-list',
    selected && 'jf-product-list--selected',
    shrinked && 'jf-product-list--shrinked',
  ].filter(Boolean).join(' ');

  const gridClasses = [
    'jf-product-list__grid',
    layout === 'ThreeColumns' && 'jf-product-list__grid--3col',
    layout === 'TwoColumns' && 'jf-product-list__grid--2col',
    layout === 'SingleColumn' && 'jf-product-list__grid--1col',
  ].filter(Boolean).join(' ');

  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  if (skeleton) {
    return (
      <div className={rootClasses}>
        <div className="jf-product-list__heading">
        <h3 className="jf-product-list__title">{title}</h3>
        <p className={`jf-product-list__subtitle ${!subtitle ? 'jf-product-list__subtitle--empty' : ''}`}>{subtitle}</p>
      </div>
        <div className="jf-product-list__toolbar">
          <div className="jf-product-list__search">
            <Icon name="Search" size={20} className="jf-product-list__search-icon" forceStyle="outline" />
            <input
              type="text"
              className="jf-product-list__search-input"
              placeholder={searchPlaceholder}
              disabled
            />
          </div>
          <div className="jf-product-list__layout-switch">
            {LAYOUT_ICONS.map(({ layout: l, iconName }) => (
              <button
                key={l}
                className={`jf-product-list__layout-btn${layout === l ? ' active' : ''}`}
                disabled
                title={l}
              >
                <Icon name={iconName} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className={gridClasses}>
          {products.map((_, i) =>
            isSingle ? (
              <SkeletonProductBasic key={i} animClass={animClass} showImages={showImages} />
            ) : (
              <SkeletonProductCard key={i} animClass={animClass} showImages={showImages} />
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClasses}>
      {/* Title */}
      <div className="jf-product-list__heading">
        <h3 className="jf-product-list__title">{title}</h3>
        <p className={`jf-product-list__subtitle ${!subtitle ? 'jf-product-list__subtitle--empty' : ''}`}>{subtitle}</p>
      </div>

      {/* Toolbar: Search + Layout Icons */}
      {showToolbar && (
        <div className="jf-product-list__toolbar">
          <div className="jf-product-list__search">
            <Icon name="Search" size={20} className="jf-product-list__search-icon" forceStyle="outline" />
            <input
              type="text"
              className="jf-product-list__search-input"
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="jf-product-list__layout-switch">
            {LAYOUT_ICONS.map(({ layout: l, iconName }) => (
              <button
                key={l}
                className={`jf-product-list__layout-btn${layout === l ? ' active' : ''}`}
                onClick={() => setLayout(l)}
                title={l}
              >
                <Icon name={iconName} size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className={gridClasses}>
        {products.map((product, i) => {
          const handleUpdate = (updates: Partial<ProductItem>) => {
            onProductsChange?.(products.map((p, idx) => idx === i ? { ...p, ...updates } : p))
          }
          return isSingle ? (
            <ProductBasicItem key={i} product={product} buttonLabel={buttonLabel} currency={currency} showImages={showImages} enableVariants={enableVariants} onUpdate={handleUpdate} />
          ) : (
            <ProductCardItem key={i} product={product} buttonLabel={buttonLabel} currency={currency} showImages={showImages} enableVariants={enableVariants} onUpdate={handleUpdate} />
          )
        })}
        {showAddNew && (isSingle ? <AddNewProductBasic onClick={handleAddProduct} /> : <AddNewProductCard onClick={handleAddProduct} />)}
      </div>
    </div>
  );
};

export default ProductList;
