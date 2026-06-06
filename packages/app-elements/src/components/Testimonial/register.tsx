import { ComponentRegistry } from '../../types/registry';
import { Testimonial, type TestimonialItem } from './Testimonial';
import type { VariantValues, PropertyValues, StateValues } from '../../types/component';
import testimonialScss from './Testimonial.scss?raw';

const DEFAULT_ITEMS: TestimonialItem[] = [
  { name: 'Sarah Johnson', text: '“This platform transformed how we collect donations. The interface is intuitive and our donors love it.”', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
  { name: 'Michael Chen', text: '“Setup was incredibly easy. We were up and running in minutes, not days.”', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
  { name: 'Emily Davis', text: '“The best investment we made for our nonprofit. Highly recommended!”', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
];

ComponentRegistry.register({
  id: 'testimonial',
  name: 'Testimonial',
  category: 'Data Display',
  icon: 'Quote',

  variants: {},

  properties: [
    { name: 'Show Avatars', type: 'boolean', default: true },
    { name: 'Selected', type: 'boolean', default: false },
    { name: 'Skeleton', type: 'boolean', default: false },
    { name: 'Items', type: 'text', default: JSON.stringify(DEFAULT_ITEMS) },
  ],

  states: [],

  scss: testimonialScss,

  colorTokens: [
    { token: 'Background', variable: '--bg-fill', value: '#FFFFFF', description: '--bg-fill → neutral-0' },
    { token: 'Avatar BG', variable: '--bg-surface-brand', value: '#EDE8FE', description: '--bg-surface-brand → primary-100' },
    { token: 'Avatar Icon', variable: '--fg-brand', value: '#7D38EF', description: '--fg-brand → primary-600' },
    { token: 'Name', variable: '--fg-primary', value: '#091141', description: '--fg-primary → neutral-900' },
    { token: 'Quote', variable: '--fg-primary', value: '#091141', description: '--fg-primary → neutral-900' },
    { token: 'Nav BG', variable: '--fg-primary', value: '#091141', description: 'color-mix(--fg-primary 8%, --bg-fill)' },
  ],

  usage: `import { Testimonial } from '@/components/Testimonial';

// Testimonial carousel with avatars
<Testimonial
  showAvatars
  items={[
    { name: "Jane Doe", text: "“Absolutely amazing product!”", avatar: "/avatars/jane.jpg" },
    { name: "John Smith", text: "“Changed how we work.”" },
    { name: "Sarah Lee", text: "“Highly recommended.”" },
  ]}
/>`,

  propDocs: [
    {
      name: 'items',
      type: 'TestimonialItem[]',
      default: '[3 default items]',
      description:
        'Array of testimonials shown as a carousel. Each item has an `avatar` (image), a `name` (title) and `text` (description). Managed from the properties panel — add, edit, delete, or hide individual items.',
    },
    {
      name: 'showAvatars',
      type: 'boolean',
      default: 'true',
      description: 'Toggles the avatar/image area. When off, each card shows only the name and quote.',
    },
    {
      name: 'selected',
      type: 'boolean',
      default: 'false',
      description: 'When `true`, applies a 2px `border-info` border.',
    },
  ],

  render(_variants: VariantValues, props: PropertyValues, _states: StateValues): React.ReactNode {
    let items: TestimonialItem[] | undefined;
    try {
      const parsed = JSON.parse(props['Items'] as string);
      items = Array.isArray(parsed) ? parsed : undefined;
    } catch {
      items = undefined;
    }
    return (
      <Testimonial
        items={items}
        showAvatars={props['Show Avatars'] as boolean}
        selected={props['Selected'] as boolean}
        skeleton={props['Skeleton'] as boolean}
      />
    );
  },
});
