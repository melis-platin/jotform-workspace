import { ComponentRegistry } from '../../types/registry';
import { Banner, type BannerAlignment, type BannerBgSource, type BannerBgMode, type BannerTextMode } from './Banner';
import type { VariantValues, PropertyValues, StateValues } from '../../types/component';
import bannerScss from './Banner.scss?raw';

ComponentRegistry.register({
  id: 'banner',
  name: 'Banner',
  category: 'Layout',
  icon: 'Megaphone',

  variants: {
    Alignment: {
      options: ['Left', 'Center'],
      default: 'Center',
    },
  },

  properties: [
    // Content
    { name: 'Title', type: 'text', default: 'Ready to grow your business?' },
    { name: 'Description', type: 'text', default: 'Join thousands of teams already building with us — it only takes a minute to start.' },
    { name: 'Button Label', type: 'text', default: 'Get started free' },
    { name: 'Show Button', type: 'boolean', default: true },
    // Button action (stored intent — mirrors the Card/Button action model)
    { name: 'Button Action', type: 'text', default: 'Do Nothing' },
    { name: 'Action Page', type: 'text', default: '' },
    { name: 'Action URL', type: 'text', default: '' },
    { name: 'Action Form', type: 'text', default: '' },
    { name: 'Action Email', type: 'text', default: '' },
    { name: 'Action Phone', type: 'text', default: '' },
    // Background
    { name: 'Background Source', type: 'text', default: 'theme' },
    { name: 'Background Mode', type: 'text', default: 'solid' },
    { name: 'Background Color', type: 'text', default: '' },
    { name: 'Gradient Start', type: 'text', default: '' },
    { name: 'Gradient End', type: 'text', default: '' },
    { name: 'Background Image', type: 'text', default: '' },
    { name: 'Background Image Name', type: 'text', default: '' },
    { name: 'Text Color', type: 'text', default: 'auto' },
    { name: 'Height', type: 'number', default: 320, min: 120, max: 720, step: 4 },
    { name: 'Selected', type: 'boolean', default: false },
    { name: 'Skeleton', type: 'boolean', default: false },
  ],

  states: [],

  scss: bannerScss,

  colorTokens: [
    { token: 'Brand Background', variable: '--bg-fill-brand', value: '#7D38EF', description: '--bg-fill-brand → primary-600 (default fill)' },
    { token: 'Light Text', variable: '--fg-inverse', value: '#FFFFFF', description: '--fg-inverse → neutral-0' },
    { token: 'Dark Text', variable: '--fg-primary', value: '#091141', description: '--fg-primary → neutral-900' },
  ],

  usage: `import { Banner } from '@/components/Banner';

// CTA banner (default fill is the light brand surface)
<Banner
  title="Ready to grow your business?"
  description="Join thousands of teams already building with us."
  buttonLabel="Get started free"
/>

// Image background, left-aligned
<Banner
  alignment="Left"
  bgSource="image"
  bgImage="/hero.jpg"
  title="Build something great"
  buttonLabel="Start now"
/>`,

  propDocs: [
    {
      name: 'title / description / buttonLabel',
      type: 'string',
      default: '"..."',
      description: 'The content slots. Title and description are always shown and edited inline on the canvas; the button is optional via `showButton`.',
    },
    {
      name: 'alignment',
      type: '"Left" | "Center"',
      default: '"Center"',
      description: 'Content alignment within the banner.',
    },
    {
      name: 'background',
      type: 'bgSource "color" | "image"; bgMode "solid" | "gradient"',
      default: 'color / solid',
      description:
        'Background is a solid colour, a two-stop gradient, or a cover image. When no colour is set it falls back to the theme brand colour. Image backgrounds get a readability scrim.',
    },
    {
      name: 'textColorMode',
      type: '"auto" | "light" | "dark"',
      default: '"auto"',
      description: 'Text colour. **auto** picks light/dark for contrast against the background; the CTA button flips to match.',
    },
    {
      name: 'height',
      type: 'number',
      default: '320',
      description: 'Minimum height in px (content grows past it). Range 120–720.',
    },
  ],

  render(variants: VariantValues, props: PropertyValues, _states: StateValues): React.ReactNode {
    return (
      <Banner
        title={props['Title'] as string}
        description={props['Description'] as string}
        buttonLabel={props['Button Label'] as string}
        showButton={props['Show Button'] as boolean}
        alignment={(variants['Alignment'] as BannerAlignment) ?? 'Center'}
        bgSource={(props['Background Source'] as BannerBgSource) || 'theme'}
        bgMode={(props['Background Mode'] as BannerBgMode) || 'solid'}
        bgColor={props['Background Color'] as string}
        gradientStart={props['Gradient Start'] as string}
        gradientEnd={props['Gradient End'] as string}
        bgImage={props['Background Image'] as string}
        textColorMode={(props['Text Color'] as BannerTextMode) || 'auto'}
        height={Number(props['Height']) || 320}
        selected={props['Selected'] as boolean}
        skeleton={props['Skeleton'] as boolean}
      />
    );
  },
});
