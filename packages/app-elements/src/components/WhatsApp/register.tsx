import { ComponentRegistry } from '../../types/registry';
import { WhatsApp } from './WhatsApp';
import type { VariantValues, PropertyValues, StateValues } from '../../types/component';
import whatsAppScss from './WhatsApp.scss?raw';

ComponentRegistry.register({
  id: 'whatsapp',
  name: 'WhatsApp',
  category: 'Actions',
  icon: 'WhatsApp',

  variants: {},

  properties: [
    { name: 'Display Style', type: 'select', default: 'Floating', options: ['Floating', 'Button'] },
    { name: 'Size', type: 'select', default: 'Medium', options: ['Small', 'Medium', 'Large'] },
    { name: 'Alignment', type: 'select', default: 'Right', options: ['Left', 'Right'] },
    { name: 'Show Label', type: 'boolean', default: false },
    { name: 'Bubble Placement', type: 'select', default: 'Beside', options: ['Beside', 'Above'] },
    { name: 'Bubble Text', type: 'text', default: 'Message us on WhatsApp', maxLength: 30 },
    { name: 'Button Width', type: 'select', default: 'Auto', options: ['Auto', 'Full'] },
    { name: 'Button Alignment', type: 'select', default: 'Center', options: ['Left', 'Center', 'Right'] },
    { name: 'Button Text', type: 'text', default: 'Message us on WhatsApp', maxLength: 30 },
    { name: 'Phone Number', type: 'text', default: '', placeholder: '+0 000-000-0000', description: 'Use the international format: +1 541-754-3010' },
    { name: 'Message', type: 'text', default: 'Hi Bloom Café! I’d like to ask about my order.', maxLength: 300, description: 'Automatically added to the chat so users can send in one tap.' },
    { name: 'Include Pages to Display', type: 'select', default: 'All Pages', options: ['All Pages'] },
    { name: 'When a User Clicks', type: 'select', default: 'Open WhatsApp', options: ['Quick Chat', 'Open WhatsApp'] },
    { name: 'Set Availability Hours', type: 'boolean', default: false },
    { name: 'Availability Days', type: 'text', default: 'M,T,W,T,F' },
    { name: 'Open Time', type: 'text', default: '09:00 AM' },
    { name: 'Close Time', type: 'text', default: '18:00 PM' },
    { name: 'Shrinked', type: 'boolean', default: false },
  ],

  states: [],
  scss: whatsAppScss,
  colorTokens: [],

  usage: `import { WhatsApp } from '@/components/WhatsApp';

<WhatsApp phoneNumber="15551234567" />`,
  propDocs: [
    {
      name: 'Phone Number',
      type: 'string',
      default: '""',
      description: 'The WhatsApp number in international format, without spaces or punctuation.',
    },
    {
      name: 'Message',
      type: 'string',
      default: '""',
      description: 'Optional message prefilled when the visitor opens WhatsApp.',
    },
  ],

  render(_variants: VariantValues, props: PropertyValues, _states: StateValues): React.ReactNode {
    const phoneNumber = String(props['Phone Number'] ?? '');
    const message = String(props['Message'] ?? '');
    return (
      <WhatsApp
        phoneNumber={phoneNumber}
        message={message}
        shrinked={props['Shrinked'] as boolean}
        displayStyle={String(props['Display Style'] ?? 'Floating')}
        buttonWidth={String(props['Button Width'] ?? 'Auto')}
        buttonAlignment={String(props['Button Alignment'] ?? 'Center')}
        buttonText={String(props['Button Text'] ?? 'Message us on WhatsApp')}
      />
    );
  },
});
