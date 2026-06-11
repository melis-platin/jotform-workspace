import { type FC, type CSSProperties } from 'react';
import { Button } from '../Button';
import './Banner.scss';

export type BannerAlignment = 'Left' | 'Center';
export type BannerBgSource = 'theme' | 'color' | 'image';
export type BannerBgMode = 'solid' | 'gradient';
export type BannerTextMode = 'auto' | 'light' | 'dark';

// Placeholder copy for a freshly-added banner — shown muted until the user edits
// the title/description (the inline editor seeds these as its default/placeholder).
export const BANNER_TITLE_PLACEHOLDER = 'Banner title';
export const BANNER_DESCRIPTION_PLACEHOLDER = 'Add description';

export interface BannerProps {
  title?: string;
  description?: string;
  buttonLabel?: string;
  /** Button action intent — when 'Do Nothing' (unset), the CTA renders muted. */
  buttonAction?: string;
  showButton?: boolean;
  alignment?: BannerAlignment;
  bgSource?: BannerBgSource;
  bgMode?: BannerBgMode;
  bgColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  bgImage?: string;
  textColorMode?: BannerTextMode;
  /** Minimum height in px; content grows past it. */
  height?: number;
  selected?: boolean;
  shrinked?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
}

// True when the background colour is dark enough that light text reads best.
function bgIsDark(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum <= 0.4;
}

export const Banner: FC<BannerProps> = ({
  title = BANNER_TITLE_PLACEHOLDER,
  description = BANNER_DESCRIPTION_PLACEHOLDER,
  buttonLabel = 'Get started free',
  buttonAction = 'Do Nothing',
  showButton = true,
  alignment = 'Center',
  bgSource = 'theme',
  bgMode = 'solid',
  bgColor = '',
  gradientStart = '',
  gradientEnd = '',
  bgImage = '',
  textColorMode = 'auto',
  height = 320,
  selected = false,
  shrinked = false,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const onImage = bgSource === 'image' && !!bgImage;
  const isColor = bgSource === 'color';
  const isGradient = isColor && bgMode === 'gradient' && !!gradientStart && !!gradientEnd;
  const hasSolid = isColor && !isGradient && !!bgColor;
  // "Theme" source (or a color source with nothing picked) → the theme brand
  // surface (CSS, so it tracks the App Designer theme live).
  const usingBrand = !onImage && !isGradient && !hasSolid;

  let textLight: boolean;
  if (textColorMode === 'light') textLight = true;
  else if (textColorMode === 'dark') textLight = false;
  else if (onImage) textLight = true;
  else if (usingBrand) textLight = false; // light brand surface → dark text
  else if (isGradient) textLight = bgIsDark(gradientStart);
  else if (hasSolid) textLight = bgIsDark(bgColor);
  else textLight = false;

  const style: CSSProperties = { ['--banner-min-height' as string]: `${height}px` };
  if (onImage) {
    style.background = `linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.55) 100%), url(${bgImage}) center/cover no-repeat`;
  } else if (isGradient) {
    style.background = `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
  } else if (hasSolid) {
    style.background = bgColor;
  }

  const rootClass = [
    'jf-banner',
    `jf-banner--align-${alignment === 'Left' ? 'left' : 'center'}`,
    // The brand default sets its own (theme-robust) text colour; only the
    // user-picked color/gradient/image cases use the auto-contrast classes.
    !usingBrand && (textLight ? 'jf-banner--text-light' : 'jf-banner--text-dark'),
    usingBrand && 'jf-banner--brand',
    onImage && 'jf-banner--has-image',
    selected && 'jf-banner--selected',
    shrinked && 'jf-banner--shrinked',
  ].filter(Boolean).join(' ');

  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  if (skeleton) {
    return (
      <div className={`${rootClass} ${animClass}`} style={style}>
        <div className="jf-banner__content">
          <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--sm" />
          <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--lg" />
          <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--md" />
        </div>
      </div>
    );
  }

  // No action wired to the CTA → render it muted so it reads as not-yet-configured.
  const buttonInactive = !buttonAction || buttonAction === 'Do Nothing';

  return (
    <div className={rootClass} style={style}>
      <div className="jf-banner__content">
        {/* Always render the placeholder copy at FULL opacity (like the app-header
            title). The inline editor clears it to a dimmed placeholder on FOCUS — so it
            reads as real default copy until you actually click in to edit (no deleting). */}
        <h2 className="jf-banner__title">{title || BANNER_TITLE_PLACEHOLDER}</h2>
        <p className="jf-banner__description">{description || BANNER_DESCRIPTION_PLACEHOLDER}</p>
        {showButton && (
          <div className={`jf-banner__cta${buttonInactive ? ' jf-banner__cta--inactive' : ''}`}>
            <Button label={buttonLabel} variant="Default" leftIcon="none" rightIcon="none" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Banner;
