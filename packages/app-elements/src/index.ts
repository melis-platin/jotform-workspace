// Icon Library Provider
export { IconLibraryProvider } from './context/IconLibraryContext';

// Component Registry & Types
export { ComponentRegistry } from './types/registry';
export type { RegisteredComponent } from './types/registry';
export type {
  ComponentDefinition,
  VariantGroup,
  ComponentProperty,
  ComponentState,
  PropDoc,
  ColorToken,
  VariantValues,
  PropertyValues,
  StateValues,
} from './types/component';

// Register all components (side-effect imports)
import './components/Card/register';
import './components/Button/register';
import './components/DonationBox/register';
import './components/ProductList/register';
import './components/Heading/register';
import './components/List/register';
import './components/Document/register';
import './components/SignDocument/register';
import './components/Image/register';
import './components/ImageGallery/register';
import './components/SocialFollow/register';
import './components/Form/register';
import './components/Table/register';
import './components/Testimonial/register';
import './components/DailyTaskManager/register';
import './components/ColorPicker/register';
export { ColorPicker as TokenColorPicker } from './components/ColorPicker/ColorPicker';
export type { ColorPickerProps as TokenColorPickerProps } from './components/ColorPicker/ColorPicker';
export { ColorPicker as HsvColorPicker } from './layout/components/ColorPicker';
import './components/EmptyState/register';
import './components/Chart/register';
import './components/AppHeader/register';
import './components/LoginSignup/register';
import './components/BottomNavigation/register';
import './components/Paragraph/register';
import './components/ProgressIndicator/register';
import './components/Spacer/register';

// Individual component exports
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Heading } from './components/Heading';
export { Form } from './components/Form';
export { Table } from './components/Table';
export { List } from './components/List';
export { Chart } from './components/Chart';
export { Paragraph } from './components/Paragraph';
export { AppHeader } from './components/AppHeader';
export { BottomNavigation } from './components/BottomNavigation';
export { AttributionBar } from './components/AttributionBar';
export { LoginSignup } from './components/LoginSignup';
export { ProductList, generateVariants, ensureProductIds, makeDimensionId, variantLabel, MAX_DIMENSIONS, MAX_VALUES_PER_DIMENSION } from './components/ProductList';
export type { ProductListProps, ProductListLayout, ProductItem, ProductOptionDimension, ProductVariant, ProductModifier, ProductModifierFieldType, ProductSubscription, ProductSubscriptionRepeatUnit } from './components/ProductList';
export { ImageGallery } from './components/ImageGallery';
export { Document } from './components/Document';
export { SignDocument } from './components/SignDocument';
export { DonationBox } from './components/DonationBox';
export { EmptyState } from './components/EmptyState';
export { Testimonial } from './components/Testimonial';
export { SocialFollow } from './components/SocialFollow';
export { DailyTaskManager } from './components/DailyTaskManager';
export { ProgressIndicator } from './components/ProgressIndicator';
export { Spacer } from './components/Spacer';

// Layout
export { AppDesigner, applyDefaultTheme, applyStoredOrDefaultTheme } from './layout/AppDesigner';
export { BottomSheet } from './layout/components/BottomSheet';

// Runtime (collections + form sheet for dynamic preset flows)
export { CollectionsProvider, useCollections } from './runtime/CollectionsContext';
export type { FormField, FormSchema, CollectionItem, CollectionsContextValue } from './runtime/CollectionsContext';
export { CartProvider, useCart } from './runtime/CartContext';
export type { CartItem, CartContextValue } from './runtime/CartContext';
export { FavoritesProvider, useFavorites } from './runtime/FavoritesContext';
export type { FavoriteItem, FavoritesContextValue } from './runtime/FavoritesContext';
export { FormSheet } from './runtime/FormSheet';

// Icon
export { Icon as AppIcon } from './components/Icon/Icon';

// Utils
export { compressImageFile, compressImageFiles } from './utils/compressImage';
export type { CompressImageOptions } from './utils/compressImage';
