import type { FC } from 'react';
import { Icon } from '@jf/design-system';
import './WhatsApp.scss';

export interface WhatsAppProps {
  phoneNumber?: string;
  message?: string;
  shrinked?: boolean;
}

function getWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export const WhatsApp: FC<WhatsAppProps> = ({
  phoneNumber = '',
  message = '',
  shrinked = false,
}) => {
  const number = getWhatsAppNumber(phoneNumber);
  const isEnabled = number.length > 0;

  const openWhatsApp = () => {
    if (!isEnabled) return;
    const query = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
    window.open(`https://wa.me/${number}${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`jf-whatsapp${shrinked ? ' jf-whatsapp--shrinked' : ''}`}>
      <button
        type="button"
        className="jf-whatsapp__cta"
        disabled={!isEnabled}
        onClick={openWhatsApp}
        aria-label="Message us on WhatsApp"
      >
        <span className="jf-whatsapp__label">Message us on WhatsApp</span>
        <span className="jf-whatsapp__icon" aria-hidden="true">
          <Icon name="whatsapp-filled" category="brands" size={20} />
        </span>
      </button>
      {!isEnabled && (
        <div className="jf-whatsapp__notice" role="status">
          <Icon name="exclamation-circle-filled" category="general" size={14} />
          <span>This element won&apos;t be visible until a phone number is added.</span>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
