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
    { name: 'Display Style', type: 'select', default: 'Button', options: ['Floating', 'Button'] },
    { name: 'Size', type: 'select', default: 'Medium', options: ['Small', 'Medium', 'Large'] },
    { name: 'Alignment', type: 'select', default: 'Right', options: ['Left', 'Right'] },
    { name: 'Show Label', type: 'boolean', default: false },
    { name: 'Bubble Placement', type: 'select', default: 'Beside', options: ['Beside', 'Above'] },
    { name: 'Bubble Text', type: 'text', default: 'Chat on WhatsApp', maxLength: 30 },
    { name: 'Button Width', type: 'select', default: 'Auto', options: ['Auto', 'Full'] },
    { name: 'Button Alignment', type: 'select', default: 'Center', options: ['Left', 'Center', 'Right'] },
    { name: 'Button Text', type: 'text', default: 'Message us', maxLength: 30 },
    { name: 'Show On', type: 'select', default: 'All Pages', options: ['All Pages'] },
    { name: 'Phone Number', type: 'text', default: '', placeholder: '+0 000-000-0000', maxLength: 16, description: 'Use the international format: +1 541-754-3010' },
    { name: 'Message', type: 'text', default: 'Hi Bloom Café! I’d like to ask about my order.', maxLength: 300, description: 'Automatically added to the chat so users can send in one tap.' },
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
    const buttonText = String(props['Button Text'] ?? 'Message us');
    return (
      <WhatsApp
        phoneNumber={phoneNumber}
        message={message}
        displayStyle={String(props['Display Style'] ?? 'Button')}
        size={String(props['Size'] ?? 'Medium')}
        alignment={String(props['Alignment'] ?? 'Right')}
        showLabel={props['Show Label'] === true}
        bubbleText={String(props['Bubble Text'] ?? 'Chat on WhatsApp')}
        bubblePlacement={String(props['Bubble Placement'] ?? 'Beside')}
        buttonWidth={String(props['Button Width'] ?? 'Auto')}
        buttonAlignment={String(props['Alignment'] ?? 'Right')}
        buttonText={buttonText}
      />
    );
  },
});
