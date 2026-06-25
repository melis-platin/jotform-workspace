import type React from 'react';
import { Icon } from '../Icon/Icon';
import './AppHeader.scss';

export type AppHeaderLayout = 'Left' | 'Center' | 'Right';

export type AppHeaderImageStyle = 'Image' | 'Icon' | 'None';

export type AppHeaderSize = 'XLarge' | 'Large' | 'Medium' | 'Small';

export type AppHeaderContentAlign = 'Center' | 'Bottom';

export interface AppHeaderProps {
  layout?: AppHeaderLayout;
  /** Vertical content alignment: 'Center' (default) or 'Bottom' — pins the
   *  content to the bottom edge (e.g. so a background image shows above it). */
  contentAlign?: AppHeaderContentAlign;
  size?: AppHeaderSize;
  /** Banner min-height: a px number (content can still grow past it) or 'auto'
   *  to fit content. When unset, falls back to the CSS default (280px). */
  minHeight?: number | 'auto';
  icon?: string;
  imageStyle?: AppHeaderImageStyle;
  imageUrl?: string | null;
  /** Icon-variant avatar colour overrides. Unset → theme tokens (white box / brand icon). */
  iconColor?: string;
  iconBgColor?: string;
  title?: string;
  subtitle?: string;
  textColor?: string;
  backgroundImageUrl?: string | null;
  /** Custom background fill — a solid color or a CSS gradient string. Ignored
   *  when a background image is set; falls back to the brand token when unset. */
  backgroundColor?: string;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
  actions?: React.ReactNode;
  actionsSlotRef?: React.RefObject<HTMLDivElement | null>;
  onIconClick?: (e: React.MouseEvent) => void;
  iconSelected?: boolean;
  /** Whole-header click (builder): selects the app header from anywhere on it. */
  onClick?: (e: React.MouseEvent) => void;
  /** Whole-header selected state (builder). */
  selected?: boolean;
  /** Center content against the full header bounds, ignoring page-card tuck compensation. */
  centerContentInBounds?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  layout = 'Center',
  contentAlign = 'Center',
  size = 'Large',
  minHeight,
  icon = 'Leaf',
  imageStyle = 'Icon',
  imageUrl,
  iconColor,
  iconBgColor,
  title = 'Urban Jungle',
  subtitle = "Istanbul's Rare Plant Haven",
  textColor,
  backgroundImageUrl,
  backgroundColor,
  skeleton = false,
  skeletonAnimation = 'pulse',
  actions,
  actionsSlotRef,
  onIconClick,
  iconSelected,
  onClick,
  selected,
  centerContentInBounds = false,
}) => {
  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  // Readability scrim over a background image. With bottom-aligned content the
  // scrim is a gradient that's dark behind the text (bottom) and fades to fully
  // transparent upward, so the photo stays crisp up top and stands out. Centered
  // content keeps a gentle overall scrim (text can sit anywhere). Both pair with
  // the text-shadow under .jf-app-header--has-bg.
  const bgScrim =
    contentAlign === 'Bottom'
      ? 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 72%)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.55) 100%)';

  // Merge the optional background image with the optional min-height override.
  // The height is published as a CSS var the SCSS reads:
  // `min-height: var(--app-header-min-height, var(--app-header-min-floor))`.
  const minHeightValue =
    minHeight == null
      ? undefined
      : minHeight === 'auto'
        ? 'auto'
        : `${minHeight}px`;

  const headerStyle = {
    ...(backgroundImageUrl
      ? { background: `${bgScrim}, url(${backgroundImageUrl}) center/cover no-repeat` }
      : backgroundColor
        ? { background: backgroundColor }
        : {}),
    ...(minHeightValue
      ? { '--app-header-min-height': minHeightValue }
      : {}),
  } as React.CSSProperties;

  if (skeleton) {
    return (
      <div className={`jf-app-header jf-app-header--${layout.toLowerCase()} jf-app-header--skeleton`} style={headerStyle}>
        <div className="jf-app-header__inner">
          <div className={`jf-app-header__icon-skeleton ${animClass}`} />
          <div className="jf-app-header__text">
            <div className={`jf-app-header__title-skeleton ${animClass}`} style={{ width: 160 }} />
            <div className={`jf-app-header__subtitle-skeleton ${animClass}`} style={{ width: 200 }} />
          </div>
        </div>
      </div>
    );
  }

  const iconClass = [
    'jf-app-header__icon',
    imageStyle === 'Image' && imageUrl && 'jf-app-header__icon--image',
    onIconClick && 'jf-app-header__icon--interactive',
    iconSelected && 'jf-app-header__icon--selected',
  ].filter(Boolean).join(' ');

  const rootClass = [
    'jf-app-header',
    `jf-app-header--${layout.toLowerCase()}`,
    `jf-app-header--size-${size.toLowerCase()}`,
    contentAlign === 'Bottom' && 'jf-app-header--valign-bottom',
    backgroundImageUrl && 'jf-app-header--has-bg',
    centerContentInBounds && 'jf-app-header--center-content-in-bounds',
    onClick && 'jf-app-header--interactive',
    selected && 'jf-app-header--selected',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      style={headerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        // Only the header chrome itself activates on Enter/Space (keyboard select).
        // Never hijack keys bubbling up from a descendant — e.g. the inline-edited
        // title/subtitle (where Enter must insert a line break) or action buttons.
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e as unknown as React.MouseEvent); }
      } : undefined}
    >
      <div className="jf-app-header__inner">
        {imageStyle !== 'None' && (
          <div
            className={iconClass}
            // Icon-variant colour overrides; never on the image variant (would tint the photo box).
            style={imageStyle === 'Image' ? undefined : { background: iconBgColor || undefined, color: iconColor || undefined }}
            onClick={onIconClick}
            role={onIconClick ? 'button' : undefined}
            tabIndex={onIconClick ? 0 : undefined}
            onKeyDown={onIconClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onIconClick(e as unknown as React.MouseEvent); } } : undefined}
          >
            {imageStyle === 'Image' && imageUrl ? (
              <img src={imageUrl} alt="" className="jf-app-header__image" />
            ) : (
              <Icon name={icon} size={48} />
            )}
          </div>
        )}
        {(title || subtitle) && (
          <div className="jf-app-header__text" style={textColor ? { color: textColor } : undefined}>
            {title && <h1 className="jf-app-header__title">{title}</h1>}
            {subtitle && <p className="jf-app-header__subtitle">{subtitle}</p>}
          </div>
        )}
      </div>
      <div ref={actionsSlotRef} className="jf-app-header__actions">
        {actions}
      </div>
    </div>
  );
};

export default AppHeader;
