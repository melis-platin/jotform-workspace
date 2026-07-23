import type { FC, MouseEvent } from 'react';
import { Icon } from '@jf/design-system';
import './WhatsApp.scss';

export interface WhatsAppProps {
  phoneNumber?: string;
  message?: string;
  shrinked?: boolean;
  displayStyle?: string;
  size?: string;
  alignment?: string;
  buttonWidth?: string;
  buttonAlignment?: string;
  buttonText?: string;
  availabilityEnabled?: boolean;
  availabilityDays?: string;
  openTime?: string;
  closeTime?: string;
}

function getWhatsAppNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

const AVAILABILITY_DAY_IDS = ['M0', 'T1', 'W2', 'T3', 'F4', 'S5', 'S6'];

function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (hours > 23 || minutes > 59) return null;
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours < 12) hours += 12;
  return hours * 60 + minutes;
}

function isWithinAvailability(
  enabled: boolean,
  days: string,
  openTime: string,
  closeTime: string,
  now = new Date(),
): boolean {
  if (!enabled) return true;

  const selectedDays = days.split(',').filter(Boolean);
  const todayIndex = (now.getDay() + 6) % 7;
  const todayId = AVAILABILITY_DAY_IDS[todayIndex];
  const legacyDayLabel = todayId[0];
  const isSelectedToday = selectedDays.includes(todayId)
    || (todayIndex < 5 && selectedDays.includes(legacyDayLabel));
  if (!isSelectedToday) return false;

  const start = parseTime(openTime);
  const end = parseTime(closeTime);
  if (start === null || end === null) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  return start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;
}

export const WhatsApp: FC<WhatsAppProps> = ({
  phoneNumber = '',
  message = '',
  shrinked = false,
  displayStyle = 'Floating',
  size = 'Medium',
  alignment = 'Right',
  buttonWidth = 'Auto',
  buttonAlignment = 'Center',
  buttonText = 'Message us on WhatsApp',
  availabilityEnabled = false,
  availabilityDays = 'M0,T1,W2,T3,F4',
  openTime = '09:00 AM',
  closeTime = '18:00 PM',
}) => {
  const number = getWhatsAppNumber(phoneNumber);
  const isEnabled = number.length > 0;
  const isButtonStyle = displayStyle === 'Button';
  const isAvailable = isWithinAvailability(
    availabilityEnabled,
    availabilityDays,
    openTime,
    closeTime,
  );
  const whatsappClassName = [
    'jf-whatsapp',
    shrinked && 'jf-whatsapp--shrinked',
    isButtonStyle
      ? `jf-whatsapp--button jf-whatsapp--button-width-${buttonWidth.toLowerCase()} jf-whatsapp--button-align-${buttonAlignment.toLowerCase()}`
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
              <span className={`jf-whatsapp__presence${isAvailable ? '' : ' jf-whatsapp__presence--offline'}`} aria-hidden="true" />
            </>}
          </button>
        </div>
        {isButtonStyle && <div className="jf-whatsapp__availability" aria-label={isAvailable ? 'Online now' : 'Offline now'}>
          <span className={`jf-whatsapp__availability-dot${isAvailable ? '' : ' jf-whatsapp__availability-dot--offline'}`} aria-hidden="true" />
          <span>{isAvailable ? 'Online now' : 'Offline now'}</span>
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
