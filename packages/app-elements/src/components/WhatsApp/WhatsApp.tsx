import type { FC, MouseEvent } from 'react';
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
  floatingDisplayStyle?: string;
  buttonWidth?: string;
  buttonAlignment?: string;
  buttonText?: string;
}

function getWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

const WHATSAPP_PHONE_MIN_LENGTH = 11;
const WHATSAPP_PHONE_MAX_LENGTH = 16;

export function isValidWhatsAppPhoneNumber(phoneNumber: string): boolean {
  const value = phoneNumber.trim();
  const normalizedNumber = getWhatsAppNumber(value);
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
  floatingDisplayStyle = 'Icon Only',
  buttonWidth = 'Auto',
  buttonAlignment = 'Center',
  buttonText = 'Message us',
}) => {
  const floatingLabel = bubbleText.slice(0, 30);
  const number = getWhatsAppNumber(phoneNumber);
  const isEnabled = isValidWhatsAppPhoneNumber(phoneNumber);
  const isButtonStyle = displayStyle === 'Button';
  const isFloatingIconAndText = !isButtonStyle && floatingDisplayStyle === 'Icon & Text';
  const usesButtonAppearance = isButtonStyle || isFloatingIconAndText;
  const effectiveButtonAlignment = isButtonStyle ? buttonAlignment : alignment;
  const whatsappClassName = [
    'jf-whatsapp',
    !usesButtonAppearance && !showLabel && 'jf-whatsapp--no-label',
    !usesButtonAppearance && showLabel && `jf-whatsapp--bubble-${bubblePlacement.toLowerCase()}`,
    isButtonStyle && showLabel && 'jf-whatsapp--button-label-above',
    isFloatingIconAndText && 'jf-whatsapp--button-bubble-above',
    usesButtonAppearance
      ? `jf-whatsapp--button jf-whatsapp--button-size-${size.toLowerCase()} jf-whatsapp--button-width-${buttonWidth.toLowerCase()} jf-whatsapp--button-align-${effectiveButtonAlignment.toLowerCase()}`
      : `jf-whatsapp--size-${size.toLowerCase()} jf-whatsapp--align-${alignment.toLowerCase()}`,
  ].filter(Boolean).join(' ');

  const openWhatsApp = (event: MouseEvent<HTMLButtonElement>) => {
    // The builder canvas uses the CTA as an element-selection target. Keep
    // navigation exclusive to interactive Live and Full Preview experiences.
    if (event.currentTarget.closest('.build-page__canvas-element')) return;
    // Open WhatsApp's click-to-chat handoff screen. That screen chooses the
    // WhatsApp app or web client instead of going straight to the homepage.
    const query = new URLSearchParams();
    if (isEnabled) query.set('phone', number);
    if (message.trim()) query.set('text', message.trim());
    const destination = `https://api.whatsapp.com/send?${query.toString()}`;
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={whatsappClassName}>
      <div className="jf-whatsapp__main">
        <div className="jf-whatsapp__main-content">
          <div className="jf-whatsapp__action-row">
            {usesButtonAppearance && showLabel && floatingLabel && <span className="jf-whatsapp__bubble">{floatingLabel}</span>}
            <div className="jf-whatsapp__control">
              <button
                type="button"
                className="jf-whatsapp__cta"
                onClick={openWhatsApp}
                aria-label={usesButtonAppearance ? buttonText : 'Message us on WhatsApp'}
              >
                {usesButtonAppearance && <span className="jf-whatsapp__icon" aria-hidden="true">
                  <img className="jf-whatsapp__icon-image" src={whatsAppIcon} alt="" />
                </span>}
                {(usesButtonAppearance || (showLabel && floatingLabel)) && <span className="jf-whatsapp__label">{usesButtonAppearance ? buttonText : floatingLabel}</span>}
                {!usesButtonAppearance && <>
                  <span className="jf-whatsapp__icon" aria-hidden="true">
                    <img className="jf-whatsapp__icon-image" src={whatsAppIcon} alt="" />
                  </span>
                </>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
