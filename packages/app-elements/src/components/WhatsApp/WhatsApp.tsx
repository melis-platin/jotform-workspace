import type { FC, MouseEvent } from 'react';
import { Icon } from '@jf/design-system';
import './WhatsApp.scss';

export interface WhatsAppProps {
  phoneNumber?: string;
  message?: string;
  shrinked?: boolean;
  displayStyle?: string;
  buttonWidth?: string;
  buttonAlignment?: string;
  buttonText?: string;
}

function getWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export const WhatsApp: FC<WhatsAppProps> = ({
  phoneNumber = '',
  message = '',
  shrinked = false,
  displayStyle = 'Floating',
  buttonWidth = 'Auto',
  buttonAlignment = 'Center',
  buttonText = 'Message us on WhatsApp',
}) => {
  const number = getWhatsAppNumber(phoneNumber);
  const isEnabled = number.length > 0;
  const isButtonStyle = displayStyle === 'Button';

  const openWhatsApp = (event: MouseEvent<HTMLButtonElement>) => {
    // The builder canvas uses the CTA as an element-selection target. Keep
    // navigation exclusive to the interactive Full Preview experience.
    if (event.currentTarget.closest('.build-page__canvas-element')) return;
    if (!isEnabled) return;
    const query = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
    window.open(`https://wa.me/${number}${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`jf-whatsapp${shrinked ? ' jf-whatsapp--shrinked' : ''}${isButtonStyle ? ` jf-whatsapp--button jf-whatsapp--button-width-${buttonWidth.toLowerCase()} jf-whatsapp--button-align-${buttonAlignment.toLowerCase()}` : ''}`}>
      <div className="jf-whatsapp__main">
        <div className="jf-whatsapp__control">
          <button
            type="button"
            className="jf-whatsapp__cta"
            disabled={!isEnabled}
            onClick={openWhatsApp}
            aria-label={isButtonStyle ? buttonText : 'Message us on WhatsApp'}
          >
            {isButtonStyle && <span className="jf-whatsapp__icon" aria-hidden="true">
              <Icon name="whatsapp-filled" category="brands" size={24} />
            </span>}
            <span className="jf-whatsapp__label">{isButtonStyle ? buttonText : 'Message us on WhatsApp'}</span>
            {!isButtonStyle && <>
              <span className="jf-whatsapp__icon" aria-hidden="true">
                <Icon name="whatsapp-filled" category="brands" size={20} />
              </span>
              <span className="jf-whatsapp__presence" aria-hidden="true" />
            </>}
          </button>
        </div>
        {isButtonStyle && <div className="jf-whatsapp__availability" aria-label="Online now">
          <span className="jf-whatsapp__availability-dot" aria-hidden="true" />
          <span>Online now</span>
        </div>}
      </div>
      {!isEnabled && (
        <div className="jf-whatsapp__notice" role="status">
          <Icon name="exclamation-circle-filled" category="general" size={16} />
          <span>This element won&apos;t be visible until a phone number is added.</span>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
