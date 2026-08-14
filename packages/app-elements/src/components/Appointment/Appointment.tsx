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
  timezone?: string;
  buttonLabel?: string;
  selected?: boolean;
}

const DEFAULT_SLOTS: AppointmentSlot[] = [
  { time: '9:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' },
  { time: '2:00 PM' }, { time: '3:00 PM' }, { time: '4:00 PM' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDate = (left: Date, right: Date) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstVisibleDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
}

export function Appointment({
  title = 'Appointment',
  slots = DEFAULT_SLOTS,
  timezone = 'Europe/Istanbul',
  selected = false,
}: AppointmentProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState('');
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const dateInputFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }), []);
  const headingFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), []);
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', { month: 'long' }), []);
  const localTime = useMemo(() => new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date()), []);
  const className = ['jf-appointment', selected && 'jf-appointment--selected'].filter(Boolean).join(' ');

  const changeMonth = (direction: number) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  return (
    <section className={className} aria-label={title}>
      <h3 className="jf-appointment__title">{title}</h3>
      <div className="jf-appointment__layout">
        <div className="jf-appointment__calendar">
          <div className="jf-appointment__date-input" aria-label="Selected appointment date">
            <span>{dateInputFormatter.format(selectedDate)}</span>
            <Icon name="Calendar" size={24} />
          </div>
          <div className="jf-appointment__calendar-controls">
            <button type="button" className="jf-appointment__month-control" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <span>{monthFormatter.format(visibleMonth)}</span>
              <Icon name="ChevronUp" size={20} />
              <Icon name="ChevronDown" size={20} />
            </button>
            <button type="button" className="jf-appointment__year-control" onClick={() => changeMonth(12)} aria-label="Next year">
              <span>{visibleMonth.getFullYear()}</span>
              <Icon name="ChevronUp" size={20} />
              <Icon name="ChevronDown" size={20} />
            </button>
          </div>
          <div className="jf-appointment__weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="jf-appointment__calendar-grid" role="grid" aria-label="Appointment calendar">
            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isPast = date < today;
              const isSelected = isSameDate(date, selectedDate);
              const isAvailable = isCurrentMonth && !isPast;
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={[
                    'jf-appointment__day',
                    !isCurrentMonth && 'jf-appointment__day--outside',
                    isPast && 'jf-appointment__day--past',
                    isSelected && 'jf-appointment__day--selected',
                  ].filter(Boolean).join(' ')}
                  onClick={() => isAvailable && selectDate(date)}
                  disabled={!isAvailable}
                  role="gridcell"
                  aria-selected={isSelected}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="jf-appointment__availability">
          <div className="jf-appointment__availability-header">
            <p>{headingFormatter.format(selectedDate)}</p>
            <div className="jf-appointment__month-navigation">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous available date"><Icon name="ChevronLeft" size={24} /></button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next available date"><Icon name="ChevronRight" size={24} /></button>
            </div>
          </div>
          <div className="jf-appointment__slots" role="radiogroup" aria-label="Available appointment times">
            {slots.map((slot) => {
              const isAvailable = slot.available !== false;
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={`jf-appointment__slot${selectedTime === slot.time ? ' jf-appointment__slot--selected' : ''}`}
                  onClick={() => isAvailable && setSelectedTime(slot.time)}
                  disabled={!isAvailable}
                  role="radio"
                  aria-checked={selectedTime === slot.time}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
          <button type="button" className="jf-appointment__timezone" aria-label="Select timezone">
            <Icon name="Clock" size={24} />
            <span>{timezone} ({localTime})</span>
            <Icon name="ChevronDown" size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Appointment;
