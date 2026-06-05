import type React from 'react';
import './Heading.scss';

export type HeadingSize = 'Large' | 'Medium' | 'Small';
export type HeadingAlignment = 'Left' | 'Center' | 'Right';
export type HeadingEmphasisStyle = 'Plain Text' | 'Badge';

export interface HeadingProps {
  size?: HeadingSize;
  alignment?: HeadingAlignment;
  heading?: string;
  subheading?: string;
  /** Optional eyebrow label rendered above the heading. */
  emphasis?: boolean;
  emphasisText?: string;
  emphasisStyle?: HeadingEmphasisStyle;
  selected?: boolean;
  shrinked?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
}

export const Heading: React.FC<HeadingProps> = ({
  size = 'Large',
  alignment = 'Left',
  heading = 'Heading',
  subheading = '',
  emphasis = false,
  emphasisText = '',
  emphasisStyle = 'Badge',
  selected = false,
  shrinked = false,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const showEyebrow = emphasis && !!emphasisText.trim();
  const eyebrow = showEyebrow ? (
    <span
      className={`jf-heading__eyebrow jf-heading__eyebrow--${emphasisStyle === 'Badge' ? 'badge' : 'plain'}`}
    >
      {emphasisText}
    </span>
  ) : null;
  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  if (skeleton) {
    const rootClasses = [
      'jf-heading',
      `jf-heading--${alignment.toLowerCase()}`,
      shrinked && 'jf-heading--shrinked',
    ].filter(Boolean).join(' ');

    return (
      <div className={rootClasses}>
        <div className={`jf-skeleton__line jf-skeleton__line--lg ${animClass}`} style={{ width: '50%' }} />
        <div className={`jf-skeleton__line jf-skeleton__line--sm ${animClass}`} style={{ width: '70%' }} />
      </div>
    );
  }

  const rootClasses = [
    'jf-heading',
    `jf-heading--${alignment.toLowerCase()}`,
    selected && 'jf-heading--selected',
    shrinked && 'jf-heading--shrinked',
  ].filter(Boolean).join(' ');

  const Tag = size === 'Large' ? 'h2' : size === 'Medium' ? 'h3' : 'h4';

  return (
    <div className={rootClasses}>
      {eyebrow}
      <Tag className={`jf-heading__title jf-heading__title--${size.toLowerCase()}`}>
        {heading}
      </Tag>
      <p className={`jf-heading__subtitle ${!subheading ? 'jf-heading__subtitle--empty' : ''}`}>{subheading}</p>
    </div>
  );
};

export default Heading;
