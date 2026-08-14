import { useMemo, useState } from 'react';
import { Icon } from '../Icon/Icon';
import './Appointment.scss';

export interface AppointmentSlot {
  time: string;
  available?: boolean;
}

export interface AppointmentProps {
  title?: string;
  description?: string;
  service?: string;
  duration?: string;
  slots?: AppointmentSlot[];
  buttonLabel?: string;
  selected?: boolean;
}

const DEFAULT_SLOTS: AppointmentSlot[] = [
  { time: '09:00 AM' },
  { time: '10:30 AM' },
  { time: '01:00 PM' },
  { time: '02:30 PM' },
  { time: '04:00 PM' },
  { time: '05:30 PM', available: false },
];

function getAvailableDates() {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return { id: date.toISOString().slice(0, 10), label: formatter.format(date) };
  });
}

export function Appointment({
  title = 'Book an appointment',
  description = 'Choose a date and time that works best for you.',
  service = 'Consultation',
  duration = '30 min',
  slots = DEFAULT_SLOTS,
  buttonLabel = 'Confirm appointment',
  selected = false,
}: AppointmentProps) {
  const dates = useMemo(getAvailableDates, []);
  const [dateId, setDateId] = useState(dates[0]?.id ?? '');
  const [time, setTime] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const selectedDate = dates.find((date) => date.id === dateId);

  const className = ['jf-appointment', selected && 'jf-appointment--selected'].filter(Boolean).join(' ');

  if (isConfirmed) {
    return (
      <section className={`${className} jf-appointment--confirmed`} aria-live="polite">
        <div className="jf-appointment__success-icon"><Icon name="Check" size={20} /></div>
        <div>
          <h3 className="jf-appointment__title">Appointment requested</h3>
          <p className="jf-appointment__description">{selectedDate?.label} at {time}. We’ll send you a confirmation shortly.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={className} aria-label={title}>
      <div className="jf-appointment__header">
        <div className="jf-appointment__header-icon"><Icon name="CalendarCheck" size={20} /></div>
        <div>
          <h3 className="jf-appointment__title">{title}</h3>
          <p className="jf-appointment__description">{description}</p>
        </div>
      </div>

      <div className="jf-appointment__service" aria-label="Appointment details">
        <Icon name="Briefcase" size={18} />
        <span>{service}</span>
        <span className="jf-appointment__service-separator" aria-hidden="true" />
        <Icon name="Clock" size={18} />
        <span>{duration}</span>
      </div>

      <div className="jf-appointment__section">
        <p className="jf-appointment__section-label">Select a date</p>
        <div className="jf-appointment__dates" role="radiogroup" aria-label="Available appointment dates">
          {dates.map((date) => (
            <button
              key={date.id}
              type="button"
              className={`jf-appointment__date${date.id === dateId ? ' jf-appointment__date--selected' : ''}`}
              onClick={() => setDateId(date.id)}
              role="radio"
              aria-checked={date.id === dateId}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      <div className="jf-appointment__section">
        <p className="jf-appointment__section-label">Select a time</p>
        <div className="jf-appointment__slots" role="radiogroup" aria-label="Available appointment times">
          {slots.map((slot) => {
            const isAvailable = slot.available !== false;
            return (
              <button
                key={slot.time}
                type="button"
                className={`jf-appointment__slot${time === slot.time ? ' jf-appointment__slot--selected' : ''}`}
                onClick={() => isAvailable && setTime(slot.time)}
                disabled={!isAvailable}
                role="radio"
                aria-checked={time === slot.time}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>

      <button className="jf-appointment__confirm" type="button" disabled={!time} onClick={() => setIsConfirmed(true)}>
        {buttonLabel}
      </button>
    </section>
  );
}

export default Appointment;
