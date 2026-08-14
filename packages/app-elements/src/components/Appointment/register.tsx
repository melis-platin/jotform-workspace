import { ComponentRegistry } from '../../types/registry';
import { Appointment } from './Appointment';
import type { AppointmentSlot } from './Appointment';
import type { VariantValues, PropertyValues, StateValues } from '../../types/component';
import scss from './Appointment.scss?raw';

const DEFAULT_SLOTS: AppointmentSlot[] = [
  { time: '9:00 AM' }, { time: '10:00 AM' }, { time: '11:00 AM' },
  { time: '2:00 PM' }, { time: '3:00 PM' }, { time: '4:00 PM' },
];

ComponentRegistry.register({
  id: 'appointment',
  name: 'Appointment',
  category: 'Widgets',
  icon: 'CalendarCheck',
  variants: {},
  properties: [
    { name: 'Title', type: 'text', default: 'Appointment' },
    { name: 'Description', type: 'text', default: 'Choose a date and available time.' },
    { name: 'Service', type: 'text', default: 'Consultation' },
    { name: 'Duration', type: 'text', default: '30 min' },
    { name: 'Time Slots', type: 'text', default: JSON.stringify(DEFAULT_SLOTS) },
    { name: 'Timezone', type: 'text', default: 'Europe/Istanbul' },
    { name: 'Button Label', type: 'text', default: 'Confirm appointment' },
    { name: 'Selected', type: 'boolean', default: false },
  ],
  states: [],
  scss,
  colorTokens: [
    { token: 'Surface', variable: '--bg-fill', value: '#FFFFFF', description: 'Primary component surface.' },
    { token: 'Service details', variable: '--bg-surface', value: '#F7F8FC', description: 'Appointment information panel.' },
    { token: 'Selected controls', variable: '--bg-surface-brand', value: '#EDE8FE', description: 'Selected date and time background.' },
    { token: 'Primary action', variable: '--bg-fill-brand', value: '#7D38EF', description: 'Confirm appointment button.' },
    { token: 'Success', variable: '--bg-fill-success', value: '#19A44B', description: 'Confirmation state icon.' },
  ],
  usage: `import { Appointment } from '@/components/Appointment';

<Appointment service="Initial consultation" duration="45 min" />`,
  propDocs: [
    { name: 'service', type: 'string', default: '"Consultation"', description: 'Service shown in the appointment summary.' },
    { name: 'duration', type: 'string', default: '"30 min"', description: 'Length of the selected service.' },
    { name: 'slots', type: 'AppointmentSlot[]', default: '6 preset slots', description: 'Available appointment times. Set available to false for unavailable times.' },
  ],
  render(_variants: VariantValues, props: PropertyValues, _states: StateValues) {
    let slots = DEFAULT_SLOTS;
    try {
      const value = props['Time Slots'];
      const parsed = typeof value === 'string' ? JSON.parse(value) : undefined;
      if (Array.isArray(parsed) && parsed.every((slot) => typeof slot?.time === 'string')) slots = parsed;
    } catch {
      // Invalid editor input keeps the dependable default time slots.
    }
    return <Appointment title={props['Title'] as string} description={props['Description'] as string} service={props['Service'] as string} duration={props['Duration'] as string} slots={slots} timezone={props['Timezone'] as string} buttonLabel={props['Button Label'] as string} selected={props['Selected'] as boolean} />;
  },
});
