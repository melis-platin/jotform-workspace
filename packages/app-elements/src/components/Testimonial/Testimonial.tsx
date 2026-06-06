import { useState, type FC } from 'react';
import { Icon } from '../Icon/Icon';
import './Testimonial.scss';

export interface TestimonialItem {
  /** Optional — lazily assigned when the item is edited (backward compat). */
  id?: string;
  name: string;
  text: string;
  avatar?: string;
  /** Original filename of an uploaded avatar (shown in the builder's image field). */
  avatarName?: string;
  /** Whether the item appears in the carousel. Defaults to visible. */
  visible?: boolean;
}

export interface TestimonialProps {
  items?: TestimonialItem[];
  showAvatars?: boolean;
  selected?: boolean;
  shrinked?: boolean;
  skeleton?: boolean;
  skeletonAnimation?: 'pulse' | 'shimmer';
}

let testimonialIdCounter = 0;

/** Unique, one-time testimonial id — stable once assigned. */
export function makeTestimonialId(): string {
  return `t_${Date.now().toString(36)}_${(testimonialIdCounter++).toString(36)}`;
}

/**
 * Lazily assigns ids to items that lack one. Returns a new array only when
 * something changed, so callers can skip redundant writes.
 */
export function ensureTestimonialIds(items: TestimonialItem[]): TestimonialItem[] {
  let changed = false;
  const next = items.map((item) => {
    if (item.id) return item;
    changed = true;
    return { ...item, id: makeTestimonialId() };
  });
  return changed ? next : items;
}

const DEFAULT_ITEMS: TestimonialItem[] = [
  { name: 'First Testimonial', text: '“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.”' },
  { name: 'Second Testimonial', text: '“Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.”' },
  { name: 'Third Testimonial', text: '“Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.”' },
];

export const Testimonial: FC<TestimonialProps> = ({
  items = DEFAULT_ITEMS,
  showAvatars = true,
  selected = false,
  shrinked = false,
  skeleton = false,
  skeletonAnimation = 'pulse',
}) => {
  const [active, setActive] = useState(0);

  const visibleItems = items.filter((it) => it.visible !== false);
  const count = visibleItems.length;
  // Clamp the active index — items can be added, removed, or hidden from the builder.
  const idx = count > 0 ? Math.min(active, count - 1) : 0;
  const current = visibleItems[idx] ?? { name: '', text: '' };

  const handlePrev = () => setActive(idx === 0 ? count - 1 : idx - 1);
  const handleNext = () => setActive(idx === count - 1 ? 0 : idx + 1);

  const rootClasses = [
    'jf-testimonial',
    shrinked && 'jf-testimonial--shrinked',
    selected && 'jf-testimonial--selected',
  ].filter(Boolean).join(' ');

  const animClass = skeletonAnimation === 'shimmer' ? 'animate-shimmer' : 'animate-pulse';

  if (skeleton) {
    return (
      <div className={rootClasses}>
        <div className={`jf-testimonial__card ${animClass}`}>
          <div className={`jf-testimonial__content${shrinked ? ' jf-testimonial__content--vertical' : ''}`}>
            {showAvatars && <div className="jf-testimonial__avatar jf-skeleton__bone" style={{ borderRadius: '50%' }} />}
            <div className="jf-testimonial__text">
              <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--lg" />
              <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--md" />
              <div className="jf-skeleton__bone jf-skeleton__line jf-skeleton__line--md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClasses}>
      <div className="jf-testimonial__card">
        <div className={`jf-testimonial__content${shrinked ? ' jf-testimonial__content--vertical' : ''}`}>
          {showAvatars && (
            <div className="jf-testimonial__avatar">
              {current.avatar ? <img src={current.avatar} alt={current.name} className="jf-testimonial__avatar-img" /> : <Icon name="User" size={40} />}
            </div>
          )}
          <div className="jf-testimonial__text">
            <h4 className="jf-testimonial__name">{current.name}</h4>
            <p className="jf-testimonial__quote">{current.text}</p>
          </div>
        </div>
        {count > 1 && (
          <div className="jf-testimonial__nav">
            <button className="jf-testimonial__nav-btn" onClick={handlePrev}>
              <Icon name="ChevronLeft" size={16} />
            </button>
            <button className="jf-testimonial__nav-btn" onClick={handleNext}>
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonial;
