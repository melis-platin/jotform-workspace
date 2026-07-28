import type { FC, MouseEvent } from 'react';
import { Icon } from '@jf/design-system';
import whatsAppIcon from '../../assets/whatsapp-figma.svg';
import './WhatsApp.scss';

export interface WhatsAppProps {
  phoneNumber?: string;
  message?: string;
  displayStyle?: string;
  size?: string;
  alignment?: string;
  showLabel?: boolean;
  bubbleText?: string;
  bubblePlacement?: string;
  buttonDisplayStyle?: string;
  buttonWidth?: string;
  buttonAlignment?: string;
  buttonText?: string;
}

function getWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

const WHATSAPP_PHONE_MIN_LENGTH = 11;
const WHATSAPP_PHONE_MAX_LENGTH = 16;

function isValidWhatsAppPhoneNumber(phoneNumber: string, normalizedNumber: string): boolean {
  const value = phoneNumber.trim();
  return value.length >= WHATSAPP_PHONE_MIN_LENGTH
    && value.length <= WHATSAPP_PHONE_MAX_LENGTH
    && normalizedNumber.length > 0;
}

export const WhatsApp: FC<WhatsAppProps> = ({
  phoneNumber = '',
  message = '',
  displayStyle = 'Button',
  size = 'Medium',
  alignment = 'Right',
  showLabel = false,
  bubbleText = '',
  bubblePlacement = 'Beside',
  buttonDisplayStyle = 'Icon Only',
  buttonWidth = 'Auto',
  buttonAlignment = 'Center',
  buttonText = 'Message us',
}) => {
  const floatingLabel = bubbleText.slice(0, 30);
  const number = getWhatsAppNumber(phoneNumber);
  const isEnabled = isValidWhatsAppPhoneNumber(phoneNumber, number);
  const isButtonStyle = displayStyle === 'Button';
  const isButtonIconAndText = buttonDisplayStyle === 'Icon & Text';
  const whatsappClassName = [
    'jf-whatsapp',
    !isButtonStyle && !showLabel && 'jf-whatsapp--no-label',
    !isButtonStyle && showLabel && `jf-whatsapp--bubble-${bubblePlacement.toLowerCase()}`,
    isButtonStyle
      ? `jf-whatsapp--button jf-whatsapp--button-size-${size.toLowerCase()} jf-whatsapp--button-width-${buttonWidth.toLowerCase()} jf-whatsapp--button-align-${buttonAlignment.toLowerCase()}`
      : `jf-whatsapp--size-${size.toLowerCase()} jf-whatsapp--align-${alignment.toLowerCase()}`,
  ].filter(Boolean).join(' ');

  const openWhatsApp = (event: MouseEvent<HTMLButtonElement>) => {
    // The builder canvas uses the CTA as an element-selection target. Keep
    // navigation exclusive to the interactive Full Preview experience.
    if (event.currentTarget.closest('.build-page__canvas-element')) return;
    if (!isEnabled) return;
    const query = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
    window.open(`https://wa.me/${number}${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={whatsappClassName}>
      <div className="jf-whatsapp__main">
        <div className="jf-whatsapp__main-content">
          <div className="jf-whatsapp__action-row">
            {isButtonStyle && showLabel && floatingLabel && <span className="jf-whatsapp__bubble">{floatingLabel}</span>}
            <div className="jf-whatsapp__control">
              <button
                type="button"
                className="jf-whatsapp__cta"
                disabled={!isEnabled}
                onClick={openWhatsApp}
                aria-label={isButtonStyle ? buttonText : 'Message us on WhatsApp'}
              >
                {isButtonStyle && <span className="jf-whatsapp__icon" aria-hidden="true">
                  <img className="jf-whatsapp__icon-image" src={whatsAppIcon} alt="" />
                </span>}
                {((isButtonStyle && isButtonIconAndText) || (showLabel && floatingLabel && !isButtonStyle)) && <span className="jf-whatsapp__label">{isButtonStyle ? buttonText : floatingLabel}</span>}
                {!isButtonStyle && <>
                  <span className="jf-whatsapp__icon" aria-hidden="true">
                    <img className="jf-whatsapp__icon-image" src={whatsAppIcon} alt="" />
                  </span>
                </>}
              </button>
            </div>
          </div>
        </div>
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
