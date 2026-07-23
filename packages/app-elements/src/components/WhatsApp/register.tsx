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
    { name: 'Phone Number', type: 'text', default: '', placeholder: '+0 000-000-0000', description: 'Use the international format: +1 541-754-3010' },
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
    return (
      <WhatsApp
        phoneNumber={phoneNumber}
        message={message}
        shrinked={props['Shrinked'] as boolean}
      />
    );
  },
});
