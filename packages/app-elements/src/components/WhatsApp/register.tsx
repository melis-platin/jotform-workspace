import { ComponentRegistry } from '../../types/registry';
import { Button } from '../Button';
import type { VariantValues, PropertyValues, StateValues } from '../../types/component';

function openWhatsApp(phoneNumber: string, message: string) {
  const phone = phoneNumber.replace(/\D/g, '');
  if (!phone) return;

  const query = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
  window.open(`https://wa.me/${phone}${query}`, '_blank', 'noopener,noreferrer');
}

ComponentRegistry.register({
  id: 'whatsapp',
  name: 'WhatsApp',
  category: 'Actions',
  icon: 'WhatsApp',

  variants: {},

  properties: [
    { name: 'Label', type: 'text', default: 'Chat on WhatsApp' },
    { name: 'Phone Number', type: 'text', default: '' },
    { name: 'Message', type: 'text', default: '' },
    { name: 'Shrinked', type: 'boolean', default: false },
  ],

  states: [],
  scss: '',
  colorTokens: [],

  usage: `import { Button } from '@/components/Button';

<Button label="Chat on WhatsApp" />`,
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
      <Button
        label={String(props['Label'] ?? 'Chat on WhatsApp')}
        leftIcon="none"
        rightIcon="none"
        width="Full"
        shrinked={props['Shrinked'] as boolean}
        onClick={phoneNumber ? () => openWhatsApp(phoneNumber, message) : undefined}
      />
    );
  },
});
