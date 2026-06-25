import type { VariantValues, PropertyValues, AppDesignerSnapshot } from '@jf/app-elements'

export interface PresetElement {
  componentId: string
  variants?: Partial<VariantValues>
  properties?: Partial<PropertyValues>
}

export interface PresetPage {
  id: string
  name: string
  icon?: string
  /** First page only: act as a public landing screen for logged-out visitors. */
  landing?: boolean
  /** Visitors must sign in to view this page (inner pages behind the landing). */
  requireLogin?: boolean
  elements: PresetElement[]
}

export interface AppHeaderPresetConfig {
  layout?: 'Left' | 'Center' | 'Right'
  contentAlign?: 'Center' | 'Bottom'
  size?: 'Large' | 'Medium' | 'Small'
  minHeight?: number
  icon?: string
  imageStyle?: 'Icon' | 'Image' | 'None'
  imageUrl?: string | null
  imageName?: string | null
  textColor?: string
  textColorMode?: 'auto' | 'light' | 'dark'
  backgroundImageUrl?: string | null
  backgroundImageName?: string | null
  bgSource?: 'color' | 'image'
  backgroundMode?: 'solid' | 'gradient'
  backgroundColor?: string
  gradientStart?: string
  gradientEnd?: string
  /** Override the banner title/subtitle independently of appTitle/appSubtitle. */
  title?: string
  subtitle?: string
  show?: boolean
}

export interface AppPreset {
  id: string
  name: string
  appTitle: string
  appSubtitle: string
  pages: PresetPage[]
  headerActions: PresetElement[]
  appHeader?: AppHeaderPresetConfig
  /** Default AppDesigner theme applied when no stored (builder-edited) theme exists. */
  theme?: AppDesignerSnapshot
}

export const EMPTY_PRESET_ID = 'empty'

export const GYM_TRAINER_ITEMS = [
  { title: 'Marcus Reid', description: 'Strength & Conditioning', image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop' },
  { title: 'Elena Vasquez', description: 'HIIT & Cardio', image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop' },
  { title: 'Jordan Lee', description: 'Yoga & Mobility', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop' },
  { title: 'David Okafor', description: 'Powerlifting', image: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=400&h=400&fit=crop' },
  { title: 'Mia Thompson', description: 'Functional Training', image: 'https://images.unsplash.com/photo-1597452485677-d661670d9640?w=400&h=400&fit=crop' },
  { title: 'Sara Kim', description: 'Pilates & Recovery', image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&h=400&fit=crop' },
]

export const APP_PRESETS: AppPreset[] = [
  {
    id: EMPTY_PRESET_ID,
    name: 'Empty App',
    appTitle: 'New App',
    appSubtitle: '',
    pages: [{ id: 'page-1', name: 'Home', icon: 'House', elements: [] }],
    headerActions: [],
  },
  {
    id: 'gym-club',
    name: 'Gym Club',
    appTitle: 'Iron Pulse',
    appSubtitle: 'Strength · Conditioning · Community',
    appHeader: {
      show: true,
      title: 'Train stronger with every session',
      subtitle: 'Classes, coaches, plans, and support in one place',
      icon: 'Dumbbell',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1000&h=600&fit=crop',
      backgroundImageName: 'gym',
    },
    headerActions: [],
    theme: {
      color: '#B8E600',
      tint: 0,
      font: 'Geist',
      headingFont: 'Geist',
      radius: 'Small',
      harmonyOffset: 150,
      activePreset: '',
      colorMode: 'light',
      tokenOverrides: {
        '--bg-page': 'oklch(0.965 0 0)',
        '--bg-surface': 'oklch(1 0 0)',
        '--bg-fill': 'oklch(1 0 0)',
        '--bg-fill-brand': '#B8E600',
        '--fg-brand': '#B8E600',
        '--fg-inverse': 'oklch(0.2022 0.05 127.52)',
        '--fg-primary': 'oklch(0.18 0 0)',
        '--fg-secondary': 'oklch(0.42 0 0)',
        '--fg-tertiary': 'oklch(0.545 0 0)',
        '--border': 'oklch(0.845 0 0)',
        '--border-hover': 'oklch(0.695 0 0)',
      },
    },
    pages: [
      {
        id: 'page-1',
        name: 'Trainers',
        icon: 'Dumbbell',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Meet Our Trainers',
              Subheading: 'Certified coaches ready to push you further.',
            },
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button',
            },
            properties: {
              'Show Header': false,
              'Button Label': 'View Profile',
              Items: JSON.stringify(GYM_TRAINER_ITEMS),
            },
          },
          { componentId: 'spacer', properties: { Height: 24 } },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Left' },
            properties: { Heading: 'Why Train With Us', Subheading: 'More than a gym — a team behind every rep.' },
          },
          { componentId: 'card', variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' }, properties: { Title: 'Certified Coaches', Description: 'Nationally accredited, years on the floor.', Icon: 'Award', Shrinked: true } },
          { componentId: 'card', variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' }, properties: { Title: 'Tailored Plans', Description: 'Programs built around your goals.', Icon: 'Target', Shrinked: true } },
          { componentId: 'card', variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' }, properties: { Title: 'Flexible Hours', Description: 'Early mornings to late evenings.', Icon: 'Clock', Shrinked: true } },
          { componentId: 'card', variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' }, properties: { Title: 'Real Results', Description: 'Track progress every session.', Icon: 'Trophy', Shrinked: true } },
        ],
      },
      {
        id: 'page-2',
        name: 'Trainer',
        icon: 'User',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: { Heading: 'Explore Trainers', Subheading: 'Choose a coach and open their profile.' },
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button',
            },
            properties: {
              Title: 'Trainers',
              'Show Header': false,
              'Button Label': 'View Profile',
              'Click Action': 'Open Dynamic Page',
              Items: JSON.stringify(GYM_TRAINER_ITEMS),
            },
          },
        ],
      },
    ],
  },
  {
    id: 'camp-registration',
    name: 'Camp Registration',
    appTitle: 'Summer Camp',
    appSubtitle: 'Sign up for the 2026 season',
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'Summer of a Lifetime',
              Subheading: 'Adventures, friendships, memories — all in one place.',
            },
          },
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=900&h=500&fit=crop',
              'Alt Text': 'Campers around a campfire',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Eight weeks. Twenty programs. Hundreds of friends in the making. Open to ages 8 – 16.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Left' },
            properties: { Heading: 'Featured Programs', Subheading: 'Pick the track that excites you most.' },
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button',
            },
            properties: {
              'Show Header': false,
              'Button Label': 'Explore',
              Items: JSON.stringify([
                { title: 'Adventure Trail', description: 'Hiking · Climbing · Kayaking', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop' },
                { title: 'Arts & Crafts', description: 'Painting · Pottery · Theater', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop' },
                { title: 'Sports League', description: 'Soccer · Tennis · Basketball', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop' },
                { title: 'Music & Drama', description: 'Band · Choir · Stage', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: { Heading: 'Why Choose Us', Subheading: 'Trusted by thousands of families.' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Safe & Certified', Description: 'CPR-certified, background-checked staff.', Icon: 'ShieldCheck', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Expert Counselors', Description: 'Coaches, artists, and educators.', Icon: 'GraduationCap', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Daily Adventures', Description: 'A new highlight every single day.', Icon: 'Compass', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Lifelong Friends', Description: 'Bonds that last beyond the summer.', Icon: 'Heart', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default', Corner: 'Rounded' },
            properties: {
              Label: 'Reserve Your Spot',
              'Left Icon': 'Plus',
              'Full Width': true,
            },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined', Corner: 'Rounded' },
            properties: {
              Label: 'Download Brochure',
              'Left Icon': 'Download',
              'Full Width': true,
            },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Schedule',
        icon: 'Calendar',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Left' },
            properties: {
              Heading: 'Camp Schedule',
              Subheading: 'Tuesday, July 7 · Week 2',
            },
          },
          {
            componentId: 'daily-task-manager',
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'This Week at a Glance', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Square', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Mon · Hiking Trail', description: 'Pine Ridge Loop · 4 hrs', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop' },
                { title: 'Tue · Pottery Workshop', description: 'Studio · 2 hrs', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=200&h=200&fit=crop' },
                { title: 'Wed · Lake Day', description: 'Kayak · Swim · 5 hrs', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=200&fit=crop' },
                { title: 'Thu · Sports League', description: 'Soccer Finals · 3 hrs', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop' },
                { title: 'Fri · Talent Show', description: 'Main Hall · 7 PM', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Featured Events', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Annual Talent Show',
              Description: 'Music, comedy, magic — Friday at 7 PM in the Main Hall.',
              'Button Label': 'Sign Up to Perform',
              'Image URL': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=350&fit=crop',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Lakeside Bonfire',
              Description: 'Stories, songs, s’mores — Saturday at 8 PM by the lake.',
              'Button Label': 'Add to Calendar',
              'Image URL': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=350&fit=crop',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Last Year’s Highlights', Subheading: '' },
          },
          {
            componentId: 'image-gallery',
            variants: { Layout: '8' },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1511497584788-876760111969?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1525193612562-0ec53b0e5d7c?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1530563885674-66db50a1af19?w=400&h=400&fit=crop',
              ]),
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'My Campers',
        icon: 'Users',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Left' },
            properties: {
              Heading: 'My Campers',
              Subheading: 'Children registered under your account.',
            },
          },
          {
            componentId: 'button',
            properties: {
              Label: 'Add new camper',
              'Left Icon': 'Plus',
              'Right Icon': 'none',
              'Full Width': true,
              Action: 'Open Form',
              'Form Title': 'Add a Camper',
              'Form Description': 'Register a new camper.',
              'Form Submit Label': 'Register Camper',
              'Form Fields': JSON.stringify([
                { name: 'name', label: 'Camper Name', type: 'text', placeholder: 'e.g. Alex Johnson' },
                { name: 'details', label: 'Age & Group', type: 'text', placeholder: 'e.g. Age 12 · Adventure Group' },
                { name: 'email', label: 'Parent Email', type: 'email', placeholder: 'parent@example.com' },
                { name: 'notes', label: 'Allergies / Notes', type: 'textarea', placeholder: 'Any allergies or special needs' },
              ]),
              'Submits To': 'campers',
            },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Compact', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Source: 'campers',
              'Title Field': 'name',
              'Description Field': 'details',
              'Empty Title': 'No campers yet',
              'Empty Description': 'Tap "Add new camper" to register your first one.',
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Info',
        icon: 'Info',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Camp Resources',
              Subheading: 'Forms, FAQs, and ways to support our mission.',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Left' },
            properties: {
              Text: 'Everything you need before, during, and after camp — all in one place.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Required Documents', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Parent Handbook.pdf', Description: 'Policies, daily flow, and FAQs.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Packing Checklist.pdf', Description: 'What to pack — and what to leave home.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Large', Alignment: 'Left' },
            properties: { 'File Name': 'Health & Consent Forms.pdf', Description: 'Required medical and emergency forms.' },
          },
          {
            componentId: 'spacer',
            properties: { Height: 32 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: { Heading: 'Send a Camper to Camp', Subheading: 'Help families who cannot afford to attend.' },
          },
          {
            componentId: 'donation-box',
            variants: { Alignment: 'Center', Size: 'Mobile' },
            properties: {
              Title: 'Scholarship Fund 2026',
              Description: 'Every dollar gives a child their first summer adventure.',
              'Show Goal': true,
              'Raised Amount': '$3,420',
              'Goal Amount': '$8,000',
              'Goal Progress': 43,
              'Show Custom Amount': true,
              'Currency Symbol': '$',
              'Button Label': 'Donate Now',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 32 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: { Heading: 'What Parents Say', Subheading: '' },
          },
          {
            componentId: 'testimonial',
            properties: { 'Show Avatars': true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 32 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Center' },
            properties: { Heading: 'Stay Connected', Subheading: '' },
          },
          {
            componentId: 'social-follow',
            variants: { Layout: 'Wrap', Variant: 'Secondary', Filled: 'No' },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'education',
    name: 'Parent Portal',
    appTitle: 'Maple Park',
    appSubtitle: 'Your family’s connection to school',
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Today',
              Subheading: 'Emma · Grade 3 · Mrs. Johnson',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'None' },
            properties: {
              Title: 'A note from Mrs. Johnson',
              Description: 'Today we read chapter 4 of "Charlotte’s Web." Ask Emma about Wilbur’s big day at the fair!',
              'Image URL': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&h=380&fit=crop',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Quick Actions', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Pickup', Description: '3:15 PM · Bus 42', Icon: 'BusFront', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Lunch', Description: 'Pasta + salad', Icon: 'Apple', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Attendance', Description: 'Present · On time', Icon: 'CircleCheck', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Message Teacher', Description: 'Reach Mrs. Johnson', Icon: 'MessageCircle', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Report Absence', Description: 'If staying home today', Icon: 'CalendarX', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Pay Lunch', Description: 'Add to balance', Icon: 'Wallet', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Tomorrow’s homework',
              Description: 'Spelling test prep · Workbook page 24',
              Icon: 'BookOpen',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'This Week', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Square', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Parent–Teacher Meet', description: 'Tue · 4:00 PM · Room 12', image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=200&h=200&fit=crop' },
                { title: 'Art Showcase', description: 'Wed · 5:30 PM · Gym', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200&h=200&fit=crop' },
                { title: 'Field Day', description: 'Sat · 10:00 AM · Sports Field', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop' },
              ]),
            },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Events',
        icon: 'Calendar',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Calendar',
              Subheading: 'Events for Grade 3 and school-wide.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Spring Concert',
              Description: 'Friday · 7:00 PM · Main Hall. Reserved seating for two adults per family.',
              'Button Label': 'RSVP',
              'Image URL': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&h=380&fit=crop',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Coming Up', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Square', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Spring Picnic', description: 'Sat May 18 · 11:00 AM · Lawn', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop' },
                { title: 'Library Open House', description: 'Wed May 22 · 4:00 PM', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=200&fit=crop' },
                { title: 'Class Field Trip', description: 'Fri May 24 · All Day', image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=200&h=200&fit=crop' },
                { title: 'STEM Fair', description: 'Tue May 28 · 5:30 PM', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop' },
                { title: 'End-of-Year Concert', description: 'Fri June 7 · 7:00 PM', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop' },
              ]),
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Photos',
        icon: 'Image',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Mrs. Johnson’s Class',
              Subheading: 'Recent moments from Emma’s school days.',
            },
          },
          {
            componentId: 'image-gallery',
            variants: { Layout: '2' },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop',
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Albums', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None',
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Class Trip', description: '32 photos', image: 'https://images.unsplash.com/photo-1546074177-31bfa593f731?w=400&h=400&fit=crop' },
                { title: 'Art Day', description: '24 photos', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop' },
                { title: 'Sports Day', description: '41 photos', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop' },
                { title: 'Music Recital', description: '18 photos', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
              ]),
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Forms',
        icon: 'FileText',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Forms & Documents',
              Subheading: 'Quick access to school paperwork.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Action Required', Subheading: '' },
          },
          {
            componentId: 'form',
            variants: { 'Layout Type': 'Card', Alignment: 'Left', Size: 'Normal' },
            properties: {
              Label: 'Emma · Field Trip Permission',
              Description: 'Due Friday — sign for May 24 trip.',
              Required: true,
              'Show Icon': true,
              Icon: 'BusFront',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'All Forms', Subheading: '' },
          },
          {
            componentId: 'form',
            variants: { 'Layout Type': 'Card', Alignment: 'Left', Size: 'Normal' },
            properties: {
              Label: 'Volunteer Sign-Up',
              Description: 'Help out at upcoming school events.',
              Required: false,
              'Show Icon': true,
              Icon: 'HeartHandshake',
            },
          },
          {
            componentId: 'form',
            variants: { 'Layout Type': 'Card', Alignment: 'Left', Size: 'Normal' },
            properties: {
              Label: 'Spring Picnic RSVP',
              Description: 'Let us know if your family is attending.',
              Required: false,
              'Show Icon': true,
              Icon: 'UtensilsCrossed',
            },
          },
          {
            componentId: 'form',
            variants: { 'Layout Type': 'Card', Alignment: 'Left', Size: 'Normal' },
            properties: {
              Label: 'Emma · Photo Release',
              Description: 'Update your photo permission preferences.',
              Required: false,
              'Show Icon': true,
              Icon: 'Camera',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 24 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Documents', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Parent Handbook.pdf', Description: 'Policies and contact info.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Academic Calendar.pdf', Description: 'Important dates for the year.' },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'healthcare',
    name: 'Healthcare Clinic',
    appTitle: 'HealthCare Clinic',
    appSubtitle: 'Quality healthcare you can trust',
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'Welcome to Our Clinic',
              Subheading: '',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Delivering high-quality care with skilled and trusted professionals — focused on your comfort and confidence at every step.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Book Appointment',
              'Left Icon': 'CalendarPlus',
              'Full Width': true,
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'image-gallery',
            variants: { Layout: '4' },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
                'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: { Heading: 'Why Choose Us', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Trusted Doctors', Description: 'Board-certified specialists', Icon: 'Stethoscope', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Quick Care', Description: 'Same-day visits available', Icon: 'Zap', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Modern Facilities', Description: 'State-of-the-art equipment', Icon: 'Building2', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Family Friendly', Description: 'All ages welcome', Icon: 'HeartHandshake', Shrinked: true },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Appointments',
        icon: 'Calendar',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'My Appointments',
              Subheading: '',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Next Visit', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Dr. Sarah Patel · Cardiology',
              Description: 'Mon Apr 6 · 10:30 AM · Suite 204. Annual check-up.',
              'Button Label': 'View Details',
              'Image URL': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&h=380&fit=crop',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Upcoming', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Dr. Marcus Lee', description: 'Dermatology · Wed Apr 22 · 2:00 PM', image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop' },
                { title: 'Dr. Anna Rivera', description: 'Internal Medicine · Mon May 5 · 9:00 AM', image: 'https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=200&h=200&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Past Visits', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Compact', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Dr. Sarah Patel', description: 'Mar 5 · Routine check-up', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
                { title: 'Dr. James Chen', description: 'Feb 18 · Lab review', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop' },
                { title: 'Dr. Marcus Lee', description: 'Jan 12 · Skin consultation', image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop' },
              ]),
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Patients',
        icon: 'Users',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: { Heading: 'Profile', Subheading: '' },
          },
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=400&h=400&fit=crop',
              'Alt Text': 'John Reed',
            },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Heading: 'John Reed',
              Subheading: 'Patient ID #JR-1042 · Member since 2021',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Quick Info', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Apr 21, 1985', Description: 'Date of Birth', Icon: 'Cake', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'O+', Description: 'Blood Type', Icon: 'Droplet', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Mar 5, 2026', Description: 'Last Visit', Icon: 'ClipboardCheck', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Family Members', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Emma Reed', description: 'Spouse · 39 · Patient since 2022', image: 'https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=200&h=200&fit=crop' },
                { title: 'Lily Reed', description: 'Daughter · 8 · Patient since 2024', image: 'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=200&h=200&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'Add Family Member',
              'Left Icon': 'Plus',
              'Full Width': true,
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Services',
        icon: 'Stethoscope',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Services',
              Subheading: 'Browse specialties and meet our team.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Specialties', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None',
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Cardiology', description: '4 specialists', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop' },
                { title: 'Dermatology', description: '3 specialists', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop' },
                { title: 'Pediatrics', description: '5 specialists', image: 'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=400&h=400&fit=crop' },
                { title: 'Internal Medicine', description: '6 specialists', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Our Doctors', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Dr. Sarah Patel', description: 'Cardiology · 12 yrs experience', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
                { title: 'Dr. Marcus Lee', description: 'Dermatology · 8 yrs experience', image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop' },
                { title: 'Dr. Anna Rivera', description: 'Internal Medicine · 15 yrs', image: 'https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=200&h=200&fit=crop' },
                { title: 'Dr. James Chen', description: 'Pediatrics · 10 yrs experience', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop' },
              ]),
            },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'online-store',
    name: 'Online Store',
    appTitle: 'Jukebox',
    appSubtitle: 'Bright scents. Clean care.',
    appHeader: {
      imageStyle: 'Image',
      imageUrl: 'https://myjukebox.com/cdn/shop/files/jukebox-logo.svg',
      imageName: 'jukebox-logo.svg',
      backgroundImageUrl: 'https://myjukebox.com/cdn/shop/files/Throwback_Thurs_1.png',
      backgroundImageName: 'fruity-edit-banner.png',
    },
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'The Fruity Edit',
              Subheading: 'Mango No. 5 × That’s Limone — today only.',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Bright citrus. Mouthwatering mango. Two limited drops, paired for the perfect summer duo.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Shop the Drop',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Today’s Pick', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Watermelon Rush Body Soap · $7',
              Description: 'Notes of watermelon and agave. 4.7★ across 860 reviews.',
              'Button Label': 'Add to Bag',
              'Image URL': 'https://myjukebox.com/cdn/shop/files/watermelon-rush-body-soap-1.png',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Why Jukebox', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Plant-Powered', Description: 'Naturally derived ingredients', Icon: 'Leaf', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Cruelty-Free', Description: 'Never tested on animals', Icon: 'Heart', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Subscribe & Save', Description: '15% off every refill', Icon: 'RefreshCw', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Free Shipping', Description: 'On orders over $45', Icon: 'Truck', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'What Customers Say', Subheading: '' },
          },
          {
            componentId: 'testimonial',
            properties: { 'Show Avatars': true },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Shop',
        icon: 'ShoppingBag',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Shop',
              Subheading: 'Bright scents. Clean care.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Body Soap', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Watermelon Rush Body Soap', price: '7.00', image: 'https://myjukebox.com/cdn/shop/files/watermelon-rush-body-soap-1.png' },
                { name: 'Sky Blue Malibu Body Soap', price: '7.00', image: 'https://myjukebox.com/cdn/shop/files/sky-blue-malibu-body-soap-1.jpg' },
                { name: 'Coconut Dreamin’ Body Soap', price: '7.00', image: 'https://myjukebox.com/cdn/shop/files/Jukebox_PDP_Coconut_Dreamin_Soap_FRONT_W_BOX.jpg' },
                { name: 'Island in the Sun Body Soap', price: '7.00', image: 'https://myjukebox.com/cdn/shop/files/island-in-the-sun-body-soap-1.jpg' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Deodorant', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Watermelon Rush Deodorant', price: '13.00', image: 'https://myjukebox.com/cdn/shop/files/watermelon-rush-deo-1.jpg' },
                { name: 'Sky Blue Malibu Deodorant', price: '13.00', image: 'https://myjukebox.com/cdn/shop/files/sky-blue-malibu-deo-1.jpg' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Body Lotion', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Watermelon Rush Body Lotion', price: '15.00', image: 'https://myjukebox.com/cdn/shop/files/Jukebox_PDP_Watermelon_Rush_Lotion_FRONT.jpg' },
                { name: 'Sky Blue Malibu Body Lotion', price: '15.00', image: 'https://myjukebox.com/cdn/shop/files/Jukebox_PDP_Sky_Blue_Malibu_Lotion_FRONT.jpg' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Body Mist', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Watermelon Rush Body Mist', price: '13.00', image: 'https://myjukebox.com/cdn/shop/files/Jukebox_PDP_Watermelon_Rush_Mist_FRONT.jpg' },
                { name: 'Sky Blue Malibu Body Mist', price: '13.00', image: 'https://myjukebox.com/cdn/shop/files/Jukebox_PDP_Sky_Blue_Malibu_Mist_FRONT.jpg' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Sets & Bundles', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Custom Deo 4-Pack · $52 → $45',
              Description: 'Build your scent lineup. Save $7 when you bundle four.',
              'Button Label': 'Build Your Pack',
              'Image URL': 'https://myjukebox.com/cdn/shop/files/custom-deo-pack_3.jpg',
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Cart',
        icon: 'ShoppingCart',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Your Cart',
              Subheading: '2 items · free shipping unlocked',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Watermelon Rush Body Soap',
              Description: '$7.00 · Qty 1',
              'Image URL': 'https://myjukebox.com/cdn/shop/files/watermelon-rush-body-soap-1.png',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Sky Blue Malibu Deodorant',
              Description: '$13.00 · Qty 1',
              'Image URL': 'https://myjukebox.com/cdn/shop/files/sky-blue-malibu-deo-1.jpg',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Subtotal $20.00 · Total $20.00', Description: 'Shipping and taxes calculated at checkout.', Icon: 'Receipt', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'Continue Shopping',
              'Full Width': true,
            },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Checkout',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Account',
        icon: 'CircleUser',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Hello, Maya',
              Subheading: 'Member since 2024 · 12 orders',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Account', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Subscriptions', Description: '2 active · next refill Mar 21', Icon: 'RefreshCw', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Orders', Description: '3 in progress', Icon: 'Package', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Addresses', Description: 'Home · Office', Icon: 'MapPin', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Payment', Description: 'Visa •••• 4242', Icon: 'CreditCard', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Help', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'FAQ', Description: 'Common questions', Icon: 'HelpCircle', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Returns & Refunds', Description: '30-day window', Icon: 'Undo2', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Contact Us', Description: 'We’re here to help', Icon: 'Mail', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'Sign Out',
              'Full Width': true,
            },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'student-management',
    name: 'Student Management',
    appTitle: 'Maple Park Roster',
    appSubtitle: 'Grade 4 · Mrs. Johnson',
    pages: [
      {
        id: 'page-1',
        name: 'My Class',
        icon: 'Users',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'My Class',
              Subheading: 'Grade 4 · 24 Students',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Quick Actions', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Take Attendance', Description: 'Mark today’s presence', Icon: 'UserCheck', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Add Note', Description: 'Quick observation', Icon: 'PencilLine', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Message Parents', Description: 'Send a class update', Icon: 'MessageSquare', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Today’s Plan', Description: 'Lesson schedule', Icon: 'CalendarClock', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Students', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Compact', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Sarah Miller', description: 'ID #2453 · Present', image: 'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=200&h=200&fit=crop' },
                { title: 'Liam Chen', description: 'ID #2461 · Present', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop' },
                { title: 'Olivia Patel', description: 'ID #2470 · Present', image: 'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=200&h=200&fit=crop' },
                { title: 'Noah Garcia', description: 'ID #2478 · Absent', image: 'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?w=200&h=200&fit=crop' },
                { title: 'Mia Thompson', description: 'ID #2485 · Present', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'View All Students',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Students',
        icon: 'Users',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Students',
              Subheading: 'Grade 4 · 24 in class',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Sarah Miller', description: 'ID #2453 · Present', image: 'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=200&h=200&fit=crop' },
                { title: 'Liam Chen', description: 'ID #2461 · Present', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop' },
                { title: 'Olivia Patel', description: 'ID #2470 · Present', image: 'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=200&h=200&fit=crop' },
                { title: 'Noah Garcia', description: 'ID #2478 · Absent', image: 'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?w=200&h=200&fit=crop' },
                { title: 'Mia Thompson', description: 'ID #2485 · Present', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop' },
                { title: 'Ethan Reyes', description: 'ID #2491 · Present', image: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=200&h=200&fit=crop' },
                { title: 'Ava Brooks', description: 'ID #2498 · Present', image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop' },
                { title: 'Lucas Wright', description: 'ID #2502 · Absent', image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=200&h=200&fit=crop' },
              ]),
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Profile',
        icon: 'IdCard',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'Sarah Miller',
              Subheading: 'Grade 4 · Mrs. Johnson · Student ID #2453',
            },
          },
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=400&h=400&fit=crop',
              'Alt Text': 'Sarah Miller',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Quick Info', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Mar 14, 2015', Description: 'Date of Birth', Icon: 'Cake', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Sept 2022', Description: 'Joined', Icon: 'CalendarDays', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Room 12', Description: 'Homeroom', Icon: 'School', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Family Contact', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Circle', Size: 'Regular', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Rachel Miller', description: 'Mother · (555) 123-4567', image: 'https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=200&h=200&fit=crop' },
                { title: 'David Miller', description: 'Father · (555) 987-6543', image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Latest Note', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Strong reading progress',
              Description: 'Sarah moved up a reading level this month — Apr 22.',
              Icon: 'BookOpen',
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Documents',
        icon: 'FileText',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Documents',
              Subheading: 'Sarah Miller · Grade 4',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Enrollment', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Enrollment Form.pdf', Description: 'Signed Sept 2, 2022.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Birth Certificate.pdf', Description: 'On file.' },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Academic', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Q3 Report Card.pdf', Description: 'Issued April 2026.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Standardized Test Results.pdf', Description: 'Spring 2026 assessment.' },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Permissions', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Photo Release.pdf', Description: 'Signed by parent — valid this year.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Field Trip Consent.pdf', Description: 'Signed for May 24 trip.' },
          },
        ],
      },
      {
        id: 'page-5',
        name: 'Health',
        icon: 'HeartPulse',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Health Profile',
              Subheading: 'Sarah Miller · Grade 4',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Allergies',
              Description: 'Peanuts, dairy. Action plan on file.',
              Icon: 'TriangleAlert',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Medications',
              Description: 'Albuterol inhaler · As needed for asthma.',
              Icon: 'Pill',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Emergency Contact',
              Description: 'Mother — Rachel Miller · (555) 123-4567',
              Icon: 'PhoneCall',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Primary Doctor',
              Description: 'Dr. Patel · Maple Family Medicine',
              Icon: 'Stethoscope',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Records', Subheading: '' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Vaccination Record.pdf', Description: 'Up to date.' },
          },
          {
            componentId: 'document',
            variants: { 'Has File': 'Yes', Size: 'Normal', Alignment: 'Left' },
            properties: { 'File Name': 'Annual Physical.pdf', Description: 'Completed Sept 2025.' },
          },
        ],
      },
      {
        id: 'page-6',
        name: 'My Profile',
        icon: 'User',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: { Heading: 'My Profile', Subheading: '' },
          },
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
              'Alt Text': 'Mrs. Sarah Johnson',
            },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Heading: 'Mrs. Sarah Johnson',
              Subheading: '4th Grade Teacher · Maple Park',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'About', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '12 yrs', Description: 'Teaching', Icon: 'GraduationCap', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Room 12', Description: 'Homeroom', Icon: 'School', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '2025–26', Description: 'School Year', Icon: 'CalendarDays', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Account', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'None', Size: 'Compact', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Account Settings', description: 'Email, password, profile' },
                { title: 'Notifications', description: 'Daily summary at 7:00 AM' },
                { title: 'Help & Support', description: 'Contact district IT' },
                { title: 'Sign Out', description: '' },
              ]),
            },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    appTitle: 'Sightglass',
    appSubtitle: 'Seasonally sourced coffee',
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/SG_SpringEquinox_Hero1-Wide-Mobile-opt.jpg?v=1770064099&width=1200',
              'Alt Text': 'Sightglass cafe interior',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'Open up your mornings',
              Subheading: '',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Seasonally sourced coffee, roasted fresh in San Francisco for a better cup every day.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Shop Coffee',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Featured This Season', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Spring Equinox · $25',
              Description: 'A bright, layered blend with notes of citrus blossom and stone fruit. Light–medium roast.',
              'Button Label': 'Add to Bag',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Spring-Equinox-Seasonal-Blend.png?crop=center&height=1200&v=1770068101&width=1200',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Our Promise', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Direct Trade', Description: 'Relationships with growers', Icon: 'HeartHandshake', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Small Batch', Description: 'Roasted to order', Icon: 'Flame', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Seasonal', Description: 'Coffees at peak flavor', Icon: 'Leaf', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '4.9 / 5', Description: '2,000+ reviews', Icon: 'Star', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'What People Are Saying', Subheading: '' },
          },
          {
            componentId: 'testimonial',
            properties: { 'Show Avatars': true },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Shop',
        icon: 'ShoppingBag',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Shop Coffee',
              Subheading: 'Roasted fresh, shipped weekly.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Blends', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Owl’s Howl Espresso', price: '21.00', image: 'https://sightglasscoffee.com/cdn/shop/files/Bag-12oz-ESPRESSO-Organic-Owls_Howl.png?crop=center&height=1000&v=1768455335&width=1000' },
                { name: 'Grizzly Peak', price: '22.50', image: 'https://sightglasscoffee.com/cdn/shop/files/Grizzly-Peak-Regenerative-Organic-Bag.png?crop=center&height=1200&v=1776818408&width=1200' },
                { name: 'Spring Equinox', price: '25.00', image: 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Spring-Equinox-Seasonal-Blend.png?crop=center&height=1200&v=1770068101&width=1200' },
                { name: 'Banner Dark', price: '22.00', image: 'https://sightglasscoffee.com/cdn/shop/files/Bag-12oz-BLENDS-Organic-Banner_Dark.png?crop=center&height=1000&v=1758137225&width=1000' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Single Origins', Subheading: '' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Bag',
              Products: JSON.stringify([
                { name: 'Colombia, La Granada', price: '27.50', image: 'https://sightglasscoffee.com/cdn/shop/files/2026_SO_MAR_Colombia_FincaLaGranada.png?crop=center&height=1200&v=1775503815&width=1200' },
                { name: 'Honduras, Nueva Esperanza', price: '28.00', image: 'https://sightglasscoffee.com/cdn/shop/files/Honduras-David-Munoz-Nueva-Esperanza.png?crop=center&height=1200&v=1775522199&width=1200' },
                { name: 'Women of Coffee, Peru', price: '25.00', image: 'https://sightglasscoffee.com/cdn/shop/files/Women-of-Coffee-Peru.png?crop=center&height=1200&v=1772761483&width=1200' },
                { name: 'Guatemala, El Sendero', price: '27.50', image: 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Guatemala-El-Sendero-Renardo-Ovalle-Single-Origin.png?crop=center&height=1200&v=1770070866&width=1200' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Subscriptions', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Single Origin Series · $22 / mo',
              Description: 'A new seasonally sourced coffee delivered to your door each month. Skip or cancel anytime.',
              'Button Label': 'Start Subscription',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Single-Origin-Series-Subscription.jpg?crop=center&height=1000&v=1761198590&width=1000',
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Cafes',
        icon: 'MapPin',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Visit Us',
              Subheading: 'Four cafes — three in San Francisco, one in Los Angeles.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'SoMa · 7th Street',
              Description: '270 7th Street, San Francisco · Mon–Fri 7a–6p · Sat–Sun 8a–6p',
              'Button Label': 'Get Directions',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/7th_Street-min.jpg?crop=center&height=1360&v=1757985881&width=1360',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Mission · 20th Street',
              Description: '3014 20th Street, San Francisco · Mon–Sun 7a–6p',
              'Button Label': 'Get Directions',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/20th-min.jpg?crop=center&height=1360&v=1757985881&width=1360',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Divisadero',
              Description: '500 Divisadero Street, San Francisco · Mon–Sun 7a–6p',
              'Button Label': 'Get Directions',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/Divisadero-min.jpg?crop=center&height=1360&v=1757985881&width=1360',
            },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Hollywood',
              Description: '1801 N Highland Ave, Los Angeles · Mon–Sun 7a–6p',
              'Button Label': 'Get Directions',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/Sycamore-min.jpg?crop=center&height=1360&v=1757985881&width=1360',
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Account',
        icon: 'User',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: { Heading: 'Hi, Maya', Subheading: '' },
          },
          {
            componentId: 'image',
            variants: { 'Has Image': 'Yes', Alignment: 'Center', Size: 'Large' },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
              'Alt Text': 'Maya',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Member since 2023 · maya@example.com',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Your Sightglass', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '12', Description: 'Orders', Icon: 'Package', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '240', Description: 'Points', Icon: 'Star', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Gold', Description: 'Tier', Icon: 'Trophy', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Active Subscription', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Single Origin Series',
              Description: 'Next ship: May 12 · $22 / mo. You can skip or pause from your dashboard.',
              'Button Label': 'Manage Subscription',
              'Image URL': 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Single-Origin-Series-Subscription.jpg?crop=center&height=1000&v=1761198590&width=1000',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Recent Orders', Subheading: '' },
          },
          {
            componentId: 'list',
            variants: { Layout: 'Basic', 'Image Style': 'Square', Size: 'Compact', Action: 'Icon' },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                { title: 'Owl’s Howl · 12oz', description: 'Apr 2 · $21.00 · Delivered', image: 'https://sightglasscoffee.com/cdn/shop/files/Bag-12oz-ESPRESSO-Organic-Owls_Howl.png?crop=center&height=1000&v=1768455335&width=1000' },
                { title: 'Spring Equinox · 12oz', description: 'Mar 18 · $25.00 · Delivered', image: 'https://sightglasscoffee.com/cdn/shop/files/Sightglass-Spring-Equinox-Seasonal-Blend.png?crop=center&height=1200&v=1770068101&width=1200' },
                { title: 'Colombia La Granada · 12oz', description: 'Mar 4 · $27.50 · Delivered', image: 'https://sightglasscoffee.com/cdn/shop/files/2026_SO_MAR_Colombia_FincaLaGranada.png?crop=center&height=1200&v=1775503815&width=1200' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Center' },
            properties: { Heading: 'Stay Connected', Subheading: '' },
          },
          {
            componentId: 'social-follow',
            variants: { Layout: 'Wrap', Variant: 'Secondary', Filled: 'No' },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'beverage-shop',
    name: 'Beverage Shop',
    appTitle: 'Esprizio',
    appSubtitle: 'Sparkling espresso spritz',
    appHeader: {
      imageStyle: 'Image',
      imageUrl: 'https://drinkesprizio.com/cdn/shop/files/Esprizio_Logo.svg',
      imageName: 'esprizio-logo.svg',
      backgroundImageUrl: 'https://drinkesprizio.com/cdn/shop/files/Espritzio-website-hero2_6804bc1e-c28b-4715-ba03-fab8e0ff3230.webp',
      backgroundImageName: 'esprizio-hero.webp',
    },
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Center' },
            properties: {
              Heading: 'Meet the Sparkling Espresso Spritz',
              Subheading: 'Perk up & chill out with us.',
            },
          },
          {
            componentId: 'paragraph',
            variants: { Size: 'Medium', Alignment: 'Center' },
            properties: {
              Text: 'Bold organic espresso, fair-trade beans, real fruit, and a fizz that lifts. 75 mg of caffeine, zero alcohol — bottled for the afternoon.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Shop Flavors',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Today’s Pick', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Blood Orange · $72.99',
              Description: 'Bold espresso meets sun-ripened blood orange — Italy’s spritz, reimagined.',
              'Button Label': 'Add to Cart',
              'Image URL': 'https://drinkesprizio.com/cdn/shop/files/can_product-blood_orange_01bdda05-03b8-409d-b7f1-c9f40abe1388.webp',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Why Esprizio', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Organic', Description: 'Real fruit, real coffee', Icon: 'Leaf', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Fair Trade', Description: 'Ethically sourced beans', Icon: 'HeartHandshake', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '75 mg Caffeine', Description: 'A clean afternoon lift', Icon: 'Zap', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: '0% Alcohol', Description: 'Spritz vibes, all-day ready', Icon: 'GlassWater', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'What People Say', Subheading: '' },
          },
          {
            componentId: 'testimonial',
            properties: { 'Show Avatars': true },
          },
        ],
      },
      {
        id: 'page-2',
        name: 'Shop',
        icon: 'ShoppingBag',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Shop',
              Subheading: 'Three flavors, one fizz.',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Single Flavors', Subheading: '6-pack · 75mg caffeine' },
          },
          {
            componentId: 'product-list',
            variants: { Layout: 'Grid' },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Cart',
              Products: JSON.stringify([
                { name: 'Blood Orange', price: '72.99', image: 'https://drinkesprizio.com/cdn/shop/files/can_product-blood_orange_01bdda05-03b8-409d-b7f1-c9f40abe1388.webp' },
                { name: 'Tangerine Chocolate', price: '72.99', image: 'https://drinkesprizio.com/cdn/shop/files/can_product-tangerine_chocolate_29a5ab11-c68c-4572-ab25-8865f48a3f17.webp' },
                { name: 'Grapefruit', price: '72.99', image: 'https://drinkesprizio.com/cdn/shop/files/can_product-grapefruit_84ce4528-da43-4dca-b80b-5850edf13111.webp' },
              ]),
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Bundles', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Vertical', Action: 'Button' },
            properties: {
              Title: 'Variety Pack · $36.99',
              Description: 'Try all three flavors — one of each, ready to chill.',
              'Button Label': 'Add to Cart',
              'Image URL': 'https://drinkesprizio.com/cdn/shop/files/can_product-pack_6ba6f9a2-018a-4ac8-8424-07ce5938fcff.webp',
            },
          },
        ],
      },
      {
        id: 'page-3',
        name: 'Cart',
        icon: 'ShoppingCart',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Your Cart',
              Subheading: '1 item · free shipping unlocked',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Square', Layout: 'Horizontal', Action: 'None' },
            properties: {
              Title: 'Variety Pack',
              Description: '$36.99 · Qty 1',
              'Image URL': 'https://drinkesprizio.com/cdn/shop/files/can_product-pack_6ba6f9a2-018a-4ac8-8424-07ce5938fcff.webp',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Subtotal $36.99 · Total $36.99', Description: 'Shipping and taxes calculated at checkout.', Icon: 'Receipt', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 8 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'Continue Shopping',
              'Full Width': true,
            },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Default' },
            properties: {
              Label: 'Checkout',
              'Right Icon': 'ArrowRight',
              'Full Width': true,
            },
          },
        ],
      },
      {
        id: 'page-4',
        name: 'Account',
        icon: 'CircleUser',
        elements: [
          {
            componentId: 'heading',
            variants: { Size: 'Large', Alignment: 'Left' },
            properties: {
              Heading: 'Hello, Alex',
              Subheading: 'Member since 2024 · Club Esprizio',
            },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Account', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Subscriptions', Description: 'Monthly variety pack · next Mar 21', Icon: 'RefreshCw', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Orders', Description: '2 in progress', Icon: 'Package', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Addresses', Description: 'Home · Office', Icon: 'MapPin', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Payment', Description: 'Visa •••• 4242', Icon: 'CreditCard', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'heading',
            variants: { Size: 'Small', Alignment: 'Left' },
            properties: { Heading: 'Help', Subheading: '' },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'FAQ', Description: 'Common questions', Icon: 'HelpCircle', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Shipping & Returns', Description: '30-day window', Icon: 'Truck', Shrinked: true },
          },
          {
            componentId: 'card',
            variants: { 'Image Style': 'Icon', Layout: 'Vertical', Action: 'None' },
            properties: { Title: 'Contact Us', Description: 'We’re here to help', Icon: 'Mail', Shrinked: true },
          },
          {
            componentId: 'spacer',
            properties: { Height: 16 },
          },
          {
            componentId: 'button',
            variants: { Type: 'Standard', Variant: 'Outlined' },
            properties: {
              Label: 'Sign Out',
              'Full Width': true,
            },
          },
        ],
      },
    ],
    headerActions: [],
  },
  {
    id: 'landing-hero',
    name: 'Landing — Hero',
    appTitle: 'Ironwell Studio',
    appSubtitle: 'Boutique strength & cycling in the heart of the city',
    headerActions: [],
    pages: [
      {
        id: 'page-1',
        name: 'Landing — Hero',
        icon: 'House',
        landing: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Your first class is on us.',
              Subheading: 'Strength, cycling, and recovery — coached, never crowded.'
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Alignment: 'Center',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=500&fit=crop',
              'Alt Text': 'Athletes mid-workout in the Ironwell strength studio'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: "45-minute coached sessions, capped at 16 spots. No contracts, no judgment — just show up and we'll handle the rest."
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Book Your Free Class',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '16 cap',
              Description: 'riders per session, so coaches know your name',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '45 min',
              Description: 'in by the hour, stronger by the next',
              Icon: 'Timer',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4.9 stars',
              Description: 'averaged across 1,200+ member reviews',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2k+ members',
              Description: 'training with us across two studios',
              Icon: 'HeartPulse',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'WHY IRONWELL',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'A gym that actually pays attention.',
              Subheading: 'Six things we got right so the work feels good.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Small by Design',
              Description: 'Capped at 16 riders so coaches actually know your name.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '45 in. 45 out.',
              Description: 'Every session is exactly 45 minutes — in by 6, out by 7.',
              Icon: 'Timer',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Coached Every Rep',
              Description: 'Certified coaches adjust form and weight in real time.',
              Icon: 'Dumbbell',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'No Contracts',
              Description: 'Pay per class or pause your membership anytime.',
              Icon: 'CalendarCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Recovery Built In',
              Description: 'Sauna, foam rolling, and mobility before you head out.',
              Icon: 'Waves',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Track Every Win',
              Description: 'Heart rate, watts, and PRs synced to your member app.',
              Icon: 'Activity',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'HOW IT WORKS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'From the couch to coached.',
              Subheading: 'No app maze, no sales calls — just book and show up.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '1 · Book a free class',
              Description: 'Pick any session this week and grab your free first spot.',
              Icon: 'CalendarPlus',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2 · Show up',
              Description: "Arrive 10 minutes early; we'll fit your bike and set your weights.",
              Icon: 'DoorOpen',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 · Get coached',
              Description: 'A certified coach dials in your form and weight, rep by rep.',
              Icon: 'Dumbbell',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4 · Get stronger',
              Description: 'Follow the plan, beat your last number, and watch it stick.',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Pick your kind of hard.',
              Subheading: 'Four signature formats, each one coached and capped.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              'Button Label': 'View Class',
              Items: JSON.stringify([
                {
                  title: 'Power Ride',
                  description: '45-min rhythm cycling on watt-tracked bikes.',
                  image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop'
                },
                {
                  title: 'Heavy Lift',
                  description: 'Barbell strength blocks with coached progressions.',
                  image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop'
                },
                {
                  title: 'Hill Climb',
                  description: 'Endurance intervals that build your engine.',
                  image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'
                },
                {
                  title: 'Mobility & Recovery',
                  description: 'Slow-flow stretch and foam-roll reset days.',
                  image: 'https://images.unsplash.com/photo-1530563885674-66db50a1af19?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'MEET THE COACHES',
              Subheading: ''
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Coaches who count reps, not heads.',
              Description: 'Every Ironwell coach is certified, full-time, and on the floor with you — cueing form, nudging weight, and remembering where you left off last week.',
              'Image URL': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&h=380&fit=crop'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'A room that roots for you.',
              Description: 'Sixteen people, one playlist, zero mirrors-only ego. Most members say the community is the reason they kept coming back.',
              'Image URL': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&h=380&fit=crop'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'REVIEWS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Loved by people who hated the gym.',
              Subheading: '4.9 stars from 1,200+ members and counting.'
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'MEMBERSHIP',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'One membership. No fine print.',
              Subheading: 'Unlimited classes at both studios for $129/mo — cancel anytime.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Unlimited classes',
              Description: 'Every format, both studios, no per-class fees',
              Icon: 'Infinity',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'No contract',
              Description: 'Pause or cancel in two taps, no penalty',
              Icon: 'BadgeCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Recovery access',
              Description: 'Sauna and mobility room included, always',
              Icon: 'Waves',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Bring a friend',
              Description: 'Two guest passes every single month',
              Icon: 'UserPlus',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'One class. Zero pressure.',
              Subheading: 'See the room, meet a coach, and decide for yourself.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Your first session is completely free — no card, no commitment. Pick a time, walk in, and feel the difference a 16-person room makes.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Book Your Free Class',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'See the Class Schedule',
              'Left Icon': 'none',
              'Right Icon': 'none',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Classes',
        icon: 'CalendarDays',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: "This Week's Classes",
              Subheading: 'Tap a session to reserve your spot.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Text: 'Spots are capped at 16, so popular sessions fill fast. Reserve early, and free up your place if plans change — no fees, no penalty.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button'
            },
            properties: {
              'Show Header': false,
              'Button Label': 'Reserve',
              Items: JSON.stringify([
                {
                  title: 'Power Ride · 6:00 AM',
                  description: 'Mon · Coach Mara · 16 spots',
                  image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop'
                },
                {
                  title: 'Heavy Lift · 12:15 PM',
                  description: 'Tue · Coach Devon · 12 spots',
                  image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop'
                },
                {
                  title: 'Hill Climb · 5:30 PM',
                  description: 'Wed · Coach Mara · 16 spots',
                  image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop'
                },
                {
                  title: 'Mobility & Recovery · 7:00 PM',
                  description: 'Thu · Coach Priya · 20 spots',
                  image: 'https://images.unsplash.com/photo-1530563885674-66db50a1af19?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'EVERY MEMBERSHIP INCLUDES',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'More than just a class slot.',
              Subheading: 'The perks that come with every reservation.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Free spot hold',
              Description: 'Cancel up to 4 hrs out with no penalty',
              Icon: 'CalendarCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Towel & shoe rental',
              Description: 'Cycling shoes and fresh towels on the house',
              Icon: 'ShoppingBag',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Live stats',
              Description: 'Watts and heart rate pushed to your app',
              Icon: 'Activity',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Recovery room',
              Description: 'Sauna and mobility space after every class',
              Icon: 'Waves',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Account',
        icon: 'User',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Your Membership',
              Subheading: 'Founders 8-Pack · 5 classes remaining'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Next Class',
              Description: 'Power Ride · Mon 6:00 AM with Coach Mara',
              Icon: 'CalendarCheck'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Classes This Month',
              Description: '11 attended · longest streak: 6 days',
              Icon: 'Flame'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'YOUR STATS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'How this season is going.',
              Subheading: 'Your numbers since you joined Ironwell.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '47 classes',
              Description: 'completed since you joined in March',
              Icon: 'Dumbbell',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '+38 watts',
              Description: 'average power gain on Power Ride',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '6-day streak',
              Description: 'your longest run so far — keep it alive',
              Icon: 'Flame',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 PRs',
              Description: 'personal records set in the last month',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Running low on classes.',
              Subheading: 'Top up your pack or switch to unlimited.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Upgrade to Unlimited',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          }
        ]
      }
    ]
  },
  {
    id: 'landing-storefront',
    name: 'Landing — Storefront',
    appTitle: 'Fernwell & Co.',
    appSubtitle: 'Indoor plants, raised right',
    headerActions: [],
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        landing: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'The Spring Repotting Sale is On',
              Subheading: '20% off every potted plant through June 21 — plus a free terracotta pot with orders over $60.'
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Alignment: 'Center',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&h=500&fit=crop',
              'Alt Text': 'A bright living room corner filled with a large monstera and trailing plants'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Greenhouse-grown in Portland, hand-potted to order, and delivered to your door in 48 hours. Every plant arrives with a care card and our 30-day stay-alive guarantee.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Shop the collection',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '30-day guarantee',
              Description: "Every plant is covered if it doesn't thrive.",
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Free repotting',
              Description: 'We pot every plant by hand before it ships.',
              Icon: 'Sprout',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '10k+ plants delivered',
              Description: 'Shipped to homes across the country last year.',
              Icon: 'Truck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4.9 stars',
              Description: 'Across 3,200+ verified customer reviews.',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'SHOP'
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Shop by Room',
              Subheading: 'Find the right plant for the light you actually have.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: 'Low-Light Corners',
                  description: 'Snake plants, ZZ, pothos',
                  image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=400&fit=crop'
                },
                {
                  title: 'Pet-Safe Picks',
                  description: 'Calatheas, ferns, prayer plants',
                  image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'
                },
                {
                  title: 'Sunny Desks & Shelves',
                  description: 'Succulents, cacti, string-of-pearls',
                  image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=400&fit=crop'
                },
                {
                  title: 'Statement Floor Plants',
                  description: 'Fiddle-leaf figs, birds of paradise',
                  image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: "This Week's Bestsellers",
              Subheading: 'Hand-potted in our greenhouse and shipped within 48 hours.'
            }
          },
          {
            componentId: 'product-list',
            variants: {
              Layout: 'Grid'
            },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Cart',
              Products: JSON.stringify([
                {
                  name: 'Monstera Deliciosa — 6" Pot',
                  price: '38.00',
                  image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop',
                  description: 'Split-leaf classic, easy in bright indirect light.'
                },
                {
                  name: 'Golden Pothos — Hanging Basket',
                  price: '24.00',
                  image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
                  description: 'Trailing, forgiving, and nearly unkillable.'
                },
                {
                  name: "Snake Plant 'Laurentii'",
                  price: '29.00',
                  image: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400&h=400&fit=crop',
                  description: 'Low-light champion that purifies the air.'
                },
                {
                  name: 'ZZ Plant — 5" Pot',
                  price: '32.00',
                  image: 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=400&h=400&fit=crop',
                  description: 'Glossy and drought-tolerant — water it monthly.'
                },
                {
                  name: 'Calathea Orbifolia — Pet-Safe',
                  price: '34.00',
                  image: 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400&h=400&fit=crop',
                  description: 'Striped show-off that loves humidity.'
                },
                {
                  name: 'Fiddle-Leaf Fig — 10" Floor',
                  price: '72.00',
                  image: 'https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=400&h=400&fit=crop',
                  description: 'The statement tree for a bright, draft-free spot.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'WHY FERNWELL'
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Plants You Can Actually Keep Alive',
              Subheading: 'We sweat the details so your plant shows up healthy and stays that way.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Care guarantee',
              Description: '30 days of free replacements if anything goes wrong.',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sustainably grown',
              Description: 'Peat-free soil and recycled nursery pots, always.',
              Icon: 'Leaf',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Expert support',
              Description: 'Text a real plant grower seven days a week.',
              Icon: 'MessageCircle',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Carbon-neutral delivery',
              Description: 'Every shipment is offset and plastic-free.',
              Icon: 'Truck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Packed to survive',
              Description: 'Custom boxes keep roots snug and leaves intact.',
              Icon: 'Package',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Care card included',
              Description: 'Light, water, and humidity tips for every plant.',
              Icon: 'BookOpen',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'HOW IT WORKS'
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'From Greenhouse to Your Home',
              Subheading: 'Four simple steps and your new plant is thriving.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '1 · Pick your plant',
              Description: 'Browse by room or light and choose your match.',
              Icon: 'Search',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2 · We pot & pack',
              Description: 'Hand-potted, watered, and boxed within 48 hours.',
              Icon: 'Sprout',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 · Delivered to your door',
              Description: 'Arrives in days, carbon-neutral, ready to unbox.',
              Icon: 'Truck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4 · We check in',
              Description: 'A week later we follow up with care tips so it thrives.',
              Icon: 'MessageCircle',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'Button',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Plant care made easy',
              Description: 'Open the Fernwell app for watering reminders, light checks, and one-tap access to a real grower when a leaf looks off. No green thumb required.',
              'Image URL': 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=700&h=380&fit=crop',
              'Button Label': 'Explore care guides'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'REVIEWS'
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Loved by 10,000+ Plant Parents',
              Subheading: 'Real notes from real Fernwell homes.'
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Get the Care Promise in Your Inbox',
              Subheading: 'Seasonal repotting tips, restock alerts, and member-only sales.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Join the Fernwell list for monthly plant-care notes written by our growers — plus first dibs on rare drops and early access to every seasonal sale. No spam, just greener thumbs.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Secondary',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Join the newsletter',
              'Left Icon': 'Mail',
              'Right Icon': 'none',
              'Full Width': true
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Ready to Bring One Home?',
              Subheading: 'Spring sale ends June 21 — 20% off every potted plant.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Free terracotta pot on orders over $60, and a 30-day guarantee on every leaf. Your living room is one plant away from better.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Shop the collection',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'View all plants',
              'Left Icon': 'none',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Shop',
        icon: 'Sprout',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'The Full Greenhouse',
              Subheading: 'Every plant ships with a care card and a 30-day stay-alive guarantee.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: 'Low-Light Corners',
                  description: 'Snake plants, ZZ, pothos',
                  image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=400&fit=crop'
                },
                {
                  title: 'Pet-Safe Picks',
                  description: 'Calatheas, ferns, prayer plants',
                  image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop'
                },
                {
                  title: 'Sunny Desks & Shelves',
                  description: 'Succulents, cacti, string-of-pearls',
                  image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=400&fit=crop'
                },
                {
                  title: 'Statement Floor Plants',
                  description: 'Fiddle-leaf figs, birds of paradise',
                  image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'All Plants',
              Subheading: 'Hand-potted to order, shipped within 48 hours.'
            }
          },
          {
            componentId: 'product-list',
            variants: {
              Layout: 'Grid'
            },
            properties: {
              Title: '',
              'Show Toolbar': false,
              'Show Images': true,
              'Add New Card': false,
              Currency: '$',
              'Button Label': 'Add to Cart',
              Products: JSON.stringify([
                {
                  name: 'Monstera Deliciosa — 6" Pot',
                  price: '38.00',
                  image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop',
                  description: 'Split-leaf classic, easy in bright indirect light.'
                },
                {
                  name: 'Golden Pothos — Hanging Basket',
                  price: '24.00',
                  image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
                  description: 'Trailing, forgiving, and nearly unkillable.'
                },
                {
                  name: "Snake Plant 'Laurentii'",
                  price: '29.00',
                  image: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400&h=400&fit=crop',
                  description: 'Low-light champion that purifies the air.'
                },
                {
                  name: 'ZZ Plant — 5" Pot',
                  price: '32.00',
                  image: 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=400&h=400&fit=crop',
                  description: 'Glossy and drought-tolerant — water it monthly.'
                },
                {
                  name: 'Calathea Orbifolia — Pet-Safe',
                  price: '34.00',
                  image: 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400&h=400&fit=crop',
                  description: 'Striped show-off that loves humidity.'
                },
                {
                  name: 'Fiddle-Leaf Fig — 10" Floor',
                  price: '72.00',
                  image: 'https://images.unsplash.com/photo-1611211232932-da3113c5b960?w=400&h=400&fit=crop',
                  description: 'The statement tree for a bright, draft-free spot.'
                }
              ])
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Account',
        icon: 'Users',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Your Account',
              Subheading: 'Orders, addresses, and your plant-care reminders.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: 'Order #FW-2041',
                  description: '2 plants · Out for delivery',
                  image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=400&h=400&fit=crop'
                },
                {
                  title: 'Saved for Later',
                  description: 'Calathea Orbifolia · String-of-Pearls',
                  image: 'https://images.unsplash.com/photo-1453904300235-0f2f60b15b5d?w=400&h=400&fit=crop'
                },
                {
                  title: 'Care Reminders',
                  description: 'Water the Monstera every Sunday',
                  image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Member Perks',
              Subheading: 'What you get as a Fernwell plant parent.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Reorder favorites',
              Description: 'One tap to restock the plants you love.',
              Icon: 'RotateCcw',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Care reminders',
              Description: 'Watering and light alerts for every plant.',
              Icon: 'Bell',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Member pricing',
              Description: 'Early access to drops and seasonal sales.',
              Icon: 'Tag',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Talk to a grower',
              Description: 'Message expert support seven days a week.',
              Icon: 'MessageCircle',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Manage account settings',
              'Left Icon': 'Settings',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      }
    ]
  },
  {
    id: 'landing-registration',
    name: 'Landing — Registration',
    appTitle: 'Aperture Weekend',
    appSubtitle: 'A 2-day photography intensive',
    headerActions: [],
    pages: [
      {
        id: 'page-1',
        name: 'Workshop',
        icon: 'Camera',
        landing: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Aperture Weekend',
              Subheading: 'Mar 14 – 15, 2026 · Portland, OR'
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Alignment: 'Center',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=900&h=500&fit=crop',
              'Alt Text': 'Photographers in a hands-on workshop session'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Two days, one camera, and a small cohort of 16. Learn to shoot in manual, light a portrait from scratch, and edit a finished series — all under the guidance of working pros. No degree required, just bring whatever camera you own.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'BY THE NUMBERS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'A weekend that punches above its size',
              Subheading: 'Small on seats, big on outcomes.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2 days',
              Description: 'of full hands-on shooting, lighting, and editing — start to finish.',
              Icon: 'CalendarDays',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '12 seats',
              Description: 'per cohort, so every shot you take gets a one-on-one look.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '15+ alumni shows',
              Description: 'of work that started right here, now hanging in galleries.',
              Icon: 'Frame',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4.9 rating',
              Description: 'averaged across 180+ past participants over four years.',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'CURRICULUM',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: "What you'll learn",
              Subheading: "Six core skills you'll practice on real subjects, not slides."
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Manual exposure',
              Description: 'Own aperture, shutter, and ISO until the meter is muscle memory.',
              Icon: 'Aperture',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Studio lighting',
              Description: 'Sculpt a face with one light, then build to a three-light setup.',
              Icon: 'Lightbulb',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Composition',
              Description: 'Frame, layer, and lead the eye so every shot feels intentional.',
              Icon: 'Crop',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Directing people',
              Description: 'Pose, prompt, and put a nervous subject at ease in seconds.',
              Icon: 'MessageSquare',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Lightroom editing',
              Description: 'Cull, color-grade, and finish a cohesive ten-image series.',
              Icon: 'Sliders',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Building a portfolio',
              Description: 'Sequence and present work that actually gets you booked.',
              Icon: 'BookImage',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'YOUR WEEKEND',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'How the two days unfold',
              Subheading: 'Foundations on Saturday, studio and edit on Sunday, your show at the end.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sat AM · Foundations',
              Description: 'Manual-exposure bootcamp and the language of natural light.',
              Icon: 'Sunrise',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sat PM · Light walk',
              Description: 'A golden-hour street walk through the Pearl District.',
              Icon: 'MapPin',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sun AM · Studio',
              Description: 'Light live models with strobes and learn to shape hard light.',
              Icon: 'Camera',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sun PM · Edit & show',
              Description: 'Build your ten-image series in the Lightroom lab, then present it.',
              Icon: 'Award',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Taught by working photographers',
              Subheading: 'People who shoot for a living, in the room with you all weekend.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=700&h=380&fit=crop',
              Title: 'Maya Okonkwo · Lead instructor',
              Description: 'Editorial and portrait photographer with a decade of magazine covers and gallery shows. She runs the studio-lighting and directing sessions.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&h=380&fit=crop',
              Title: 'Daniel Reyes · Edit & critique',
              Description: 'Documentary shooter and longtime retoucher. He leads the Lightroom lab and the shot-by-shot portfolio critiques.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'PAST WORK',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Shot by alumni, in two days',
              Subheading: 'Every frame below was made by a first-time participant.'
            }
          },
          {
            componentId: 'image-gallery',
            variants: {
              Layout: '4'
            },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop'
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'REVIEWS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Loved by past cohorts',
              Subheading: 'What alumni say after their weekend.'
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'RESERVE',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Reserve your spot',
              Subheading: 'Only 12 seats — early-bird pricing ends Feb 1.'
            }
          },
          {
            componentId: 'login-signup',
            variants: {
              Mode: 'Signup',
              Layout: 'Center'
            },
            properties: {
              Title: 'Save your seat',
              Subtitle: 'Register in 30 seconds. $349 early-bird — pay at confirmation, no card to hold your spot.',
              'Button Label': 'Register now',
              'Input Icons': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'BEFORE YOU BOOK',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Good to know',
              Subheading: 'The answers we get asked most.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Pricing',
              Description: '$349 early-bird through Feb 1, then $399. Pay at confirmation — no deposit holds your seat.',
              Icon: 'Tag'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: "What's included",
              Description: 'All studio time, live models, lighting gear, lunch both days, and a completion certificate.',
              Icon: 'PackageCheck'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Refund policy',
              Description: 'Full refund up to 14 days before. Within 14 days, transfer your seat to a friend or a future weekend.',
              Icon: 'Undo2'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Gear to bring',
              Description: 'Any camera with manual mode, a charged battery, an SD card, and a laptop for the edit lab. No camera? Borrow one of ours.',
              Icon: 'Backpack'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Ready to shoot all weekend?',
              Subheading: '12 seats, one cohort, a portfolio by Sunday night.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: "Early-bird pricing ends Feb 1. Lock in your seat now and we'll send the full schedule and gear list straight to your inbox."
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Reserve my seat',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'View the full agenda',
              'Left Icon': 'CalendarDays',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-schedule',
        name: 'Schedule',
        icon: 'CalendarCheck',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Weekend Agenda',
              Subheading: 'Two full days · Doors at 9:00 AM, both mornings'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Text: "Here's how the two days break down. Each block is hands-on — you'll be shooting or editing, not sitting through lectures. Times are approximate; we follow the light."
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Saturday · Foundations',
              Subheading: ''
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: '9:00 — Manual Mode Bootcamp',
                  description: 'Aperture, shutter, ISO — demystified by lunch.',
                  image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=400&fit=crop'
                },
                {
                  title: '1:00 — Natural Light Walk',
                  description: 'Shoot the Pearl District in golden afternoon light.',
                  image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop'
                },
                {
                  title: '4:00 — Group Critique',
                  description: 'Bring your best three frames to the table.',
                  image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Sunday · Studio & Edit',
              Subheading: ''
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: '9:00 — Studio Portrait Lighting',
                  description: 'One light, then three — sculpting a face with strobes.',
                  image: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400&h=400&fit=crop'
                },
                {
                  title: '1:00 — Lightroom Edit Lab',
                  description: 'Cull, color, and finish a 10-image series.',
                  image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop'
                },
                {
                  title: '4:00 — Portfolio Showcase',
                  description: 'Present your finished series; certificates handed out.',
                  image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Both evenings · Optional',
              Subheading: ''
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '6:30 — Cohort dinner',
              Description: 'Walk to a nearby spot for a relaxed group dinner. Optional, and a great place to ask the instructors anything.',
              Icon: 'Utensils'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '8:00 — Open edit hours',
              Description: 'Studio stays open with an instructor on hand if you want extra time on your edits.',
              Icon: 'Clock'
            }
          }
        ]
      },
      {
        id: 'page-registration',
        name: 'My Registration',
        icon: 'Ticket',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Left'
            },
            properties: {
              Heading: "You're registered",
              Subheading: 'Seat #07 · Aperture Weekend, Mar 14 – 15'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=700&h=380&fit=crop',
              Title: 'See you in Studio 6',
              Description: "Your seat is confirmed and paid. Add the weekend to your calendar below so it's locked in."
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Location',
              Description: 'Studio 6, 1140 NW Everett St, Portland, OR 97209',
              Icon: 'MapPin'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Arrival',
              Description: 'Doors 9:00 AM both days. Coffee and bagels from 8:30.',
              Icon: 'Clock'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'What to bring',
              Description: 'Any camera, a charged battery, and a laptop for the edit lab.',
              Icon: 'Camera'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Your booking',
              Subheading: ''
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Order #AW-2026-0147',
              Description: '$349 early-bird · Paid Jan 12, 2026 · Visa ending 4421',
              Icon: 'Receipt'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Need to change plans?',
              Description: "Full refund up to 14 days out, or transfer your seat to a friend any time. Reply to your confirmation email and we'll sort it.",
              Icon: 'Undo2'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Add to calendar',
              'Left Icon': 'CalendarPlus',
              'Right Icon': 'none',
              'Full Width': true
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'View the full agenda',
              'Left Icon': 'CalendarDays',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      }
    ]
  },
  {
    id: 'landing-editorial',
    name: 'Landing — Editorial',
    appTitle: 'Northside Table',
    appSubtitle: 'A neighborhood food bank, run by neighbors',
    headerActions: [],
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        icon: 'House',
        landing: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'No one on Northside should go hungry.',
              Subheading: "Since 2009, we've turned a church basement into a fresh-food pantry serving 1,400 families a week."
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Alignment: 'Center',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&h=500&fit=crop',
              'Alt Text': 'Volunteers packing fresh produce boxes at the Northside Table pantry'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'It started with one folding table and a few crates of bruised apples. Fifteen years later, our volunteers rescue 90,000 pounds of food a month from going to waste — and put it on the tables of our own neighbors, no questions asked.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'OUR IMPACT',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'What your neighbors built',
              Subheading: 'Every number here is a real plate of food, made possible by people who live a few blocks away.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '12,000 meals',
              Description: 'packed and handed out in the last month alone, free to any family who walks in.',
              Icon: 'Utensils',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '300 volunteers',
              Description: 'neighbors, students, and retirees who sort, drive, and cook every single week.',
              Icon: 'HandHeart',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '8 years',
              Description: 'of keeping the lights on and the shelves full, through good times and hard ones.',
              Icon: 'CalendarHeart',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '40 partners',
              Description: 'local grocers, farms, and bakeries who donate good food before it goes to waste.',
              Icon: 'Handshake',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Our story',
              Subheading: 'How a folding table on 4th Street became a neighborhood institution.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'None'
            },
            properties: {
              Title: 'Our story: a table that grew',
              Description: "When the plant on 4th Street closed, Rosa Mendez started cooking extra to share with laid-off neighbors. The line outside her door became a pantry, the pantry became a co-op, and the co-op became Northside Table. We still cook from Rosa's chili recipe every Friday.",
              'Image URL': 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=700&h=380&fit=crop'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Square',
              Layout: 'Vertical',
              Action: 'Button'
            },
            properties: {
              Title: 'More than a meal',
              Description: 'Hunger is rarely the only thing a family is carrying. Alongside groceries, our caseworkers help neighbors sign up for benefits, find work, and connect with a clinic next door. Last year we made 2,300 of those warm hand-offs.',
              'Button Label': 'Read more stories',
              'Image URL': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=380&fit=crop'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'PROGRAMS',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'How we help',
              Subheading: 'Four programs that meet our neighbors wherever they are — at home, at school, or on the corner.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Mobile pantry',
              Description: 'Our produce truck parks in five neighborhoods a week so groceries reach folks without a ride.',
              Icon: 'Truck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Hot meals',
              Description: "Friday night dinners from Rosa's kitchen — a warm plate and a table where everyone's welcome.",
              Icon: 'Soup',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Kids backpacks',
              Description: 'Weekend food packs tucked into 600 backpacks so no child goes hungry when school meals stop.',
              Icon: 'Backpack',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Senior delivery',
              Description: 'Volunteer drivers carry boxes right to the door for homebound elders across Northside.',
              Icon: 'HousePlus',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'In photos',
              Subheading: 'Market mornings, packing nights, and full tables — straight from our pantry floor.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'image-gallery',
            variants: {
              Layout: '4'
            },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1546074177-31bfa593f731?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop'
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'GET INVOLVED',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'How you can help',
              Subheading: "Four simple ways to keep a neighbor's table full this week."
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '1 · Donate',
              Description: 'Just $1 buys three meals through our wholesale partners. A monthly gift keeps the truck running.',
              Icon: 'HeartHandshake',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2 · Volunteer',
              Description: "Give two hours sorting, driving, or cooking. We'll match you to a role and a shift that fits.",
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 · Host a drive',
              Description: "Run a food or fund drive at work, school, or on your block — we'll send a kit.",
              Icon: 'Boxes',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4 · Spread the word',
              Description: 'Share our pantry hours with a neighbor who needs them, or post our story to your feed.',
              Icon: 'Megaphone',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'VOICES',
              Subheading: ''
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'From the people we feed and serve',
              Subheading: 'Neighbors and volunteers on what Northside Table means to them.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'donation-box',
            variants: {
              'Heading Alignment': 'Center',
              Size: 'Web'
            },
            properties: {
              Title: 'Help us do more',
              Description: '$1 buys 3 meals through our wholesale partners. Our spring goal keeps the produce truck running through the summer gap, when school meals stop.',
              'Show Goal': true,
              'Raised Amount': '$31,000',
              'Goal Amount': '$50,000',
              'Goal Progress': 62,
              'Show Custom Amount': true,
              'Currency Symbol': '$',
              'Button Label': 'Donate Now'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Follow along',
              Subheading: 'Market days, volunteer calls, and the occasional photo of a very full truck.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Ready to set a place at the table?',
              Subheading: 'Whether you give an hour or a dollar, you keep a neighbor fed this week.'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: "Join 300 neighbors who already pitch in. Pick a shift, make a gift, or just stop by the next market and say hello — there's room for everyone at Northside Table."
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Get involved',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Donate today',
              'Left Icon': 'Heart',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Events',
        icon: 'CalendarCheck',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Upcoming events',
              Subheading: 'Come for the food, stay for the neighbors.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button'
            },
            properties: {
              'Show Header': false,
              'Button Label': 'RSVP',
              Items: JSON.stringify([
                {
                  title: 'Saturday Fresh Market',
                  description: 'Jun 14 · 9am–12pm · Northside Hall — Free produce, no ID needed',
                  image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop'
                },
                {
                  title: 'Community Cook-Off Fundraiser',
                  description: "Jun 21 · 5pm · Rosa's Kitchen — $20 a plate, all you can eat chili",
                  image: 'https://images.unsplash.com/photo-1546074177-31bfa593f731?w=400&h=400&fit=crop'
                },
                {
                  title: 'Back-to-School Pantry Drive',
                  description: 'Aug 9 · 10am–2pm · 4th Street Lot — Groceries + free backpacks',
                  image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=400&fit=crop'
                },
                {
                  title: 'Harvest Volunteer Day',
                  description: 'Aug 23 · 8am · Riverside Farm — Glean fields, then share lunch',
                  image: 'https://images.unsplash.com/photo-1530563885674-66db50a1af19?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'What to expect',
              Subheading: 'A few things that are true at every Northside Table gathering.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Always free',
              Description: "Markets and meals cost nothing. Fundraisers are clearly marked when they're not.",
              Icon: 'Gift',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Everyone welcome',
              Description: "No ID, no income check, no questions. If you're hungry, you belong here.",
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Family friendly',
              Description: "Bring the kids — there's a craft table at every market and snacks to spare.",
              Icon: 'Baby',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Easy to reach',
              Description: 'Every venue sits on a bus line, with parking and step-free entry at the door.',
              Icon: 'Bus',
              Shrinked: true
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Volunteer',
        icon: 'HandHeart',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Lend a hand',
              Subheading: 'Two hours a week feeds a dozen families. Pick a role that fits your schedule.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Sort & pack',
              Description: 'Box up produce and dry goods on Tuesday and Thursday mornings.',
              Icon: 'Truck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Welcome desk',
              Description: 'Greet neighbors, sign families in, and point folks to resources.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Food rescue driver',
              Description: 'Pick up donations from grocers in our van, on your own hours.',
              Icon: 'Recycle',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Friday kitchen',
              Description: "Cook and serve Rosa's chili for the weekly community dinner.",
              Icon: 'Flame',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Open volunteer roles',
              Subheading: 'Browse what we need this season and sign up in a tap.'
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Card',
              'Card Image Style': 'Square',
              'Card Layout': 'Vertical',
              'Card Size': 'Medium',
              'Card Action': 'Button'
            },
            properties: {
              'Show Header': false,
              'Button Label': 'Sign up',
              Items: JSON.stringify([
                {
                  title: 'Tuesday Morning Packers',
                  description: '8am–11am · Northside Hall — Sort produce and build family boxes. No experience needed.',
                  image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop'
                },
                {
                  title: 'Mobile Pantry Crew',
                  description: 'Wed & Fri · Various stops — Ride the truck, set up tables, and hand out groceries.',
                  image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=400&fit=crop'
                },
                {
                  title: 'Senior Delivery Drivers',
                  description: 'Fridays · Flexible route — Carry boxes door-to-door for homebound elders. Your car, our gas card.',
                  image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop'
                },
                {
                  title: 'Friday Kitchen Team',
                  description: "4pm–8pm · Rosa's Kitchen — Prep, cook, and serve the weekly community dinner.",
                  image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Why volunteers stay',
              Subheading: 'The small things that make a shift worth showing up for.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Flexible shifts',
              Description: 'Sign up for one morning or every week — swap and cancel anytime, no guilt.',
              Icon: 'CalendarClock',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Real community',
              Description: "You'll learn names, share a meal, and leave knowing exactly who you helped.",
              Icon: 'HeartHandshake',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'We train you',
              Description: "Every role starts with a friendly orientation. Show up curious; we'll handle the rest.",
              Icon: 'GraduationCap',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Hours that count',
              Description: 'We log and verify service hours for students, employers, and court programs.',
              Icon: 'BadgeCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Sign up to volunteer',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          }
        ]
      }
    ]
  },
  {
    id: 'landing-saas',
    name: 'Landing — SaaS',
    appTitle: 'Tally',
    appSubtitle: 'Budgeting that finally sticks',
    pages: [
      {
        id: 'page-1',
        name: 'Landing — SaaS',
        icon: 'Wallet',
        landing: true,
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Everything your money needs',
              Subheading: 'Six tools that quietly do the boring parts for you.',
              'Add Emphasis': true,
              'Emphasis Text': 'FEATURES',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Auto-categorize',
              Description: 'Every transaction sorted the moment it lands — no spreadsheets.',
              Icon: 'Sparkles',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Smart budgets',
              Description: 'Budgets that build themselves from how you actually spend.',
              Icon: 'Wallet',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Bill reminders',
              Description: 'A heads-up before every bill, so nothing slips through.',
              Icon: 'BellRing',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Savings goals',
              Description: 'Name a goal, set a date, and watch Tally find the money.',
              Icon: 'PiggyBank',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Spending insights',
              Description: 'See where it went with clear weekly and monthly trends.',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Bank-level security',
              Description: '256-bit encryption, read-only access, never sold.',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Set up in two minutes',
              Subheading: 'No spreadsheets, no manual entry — just connect and go.',
              'Add Emphasis': true,
              'Emphasis Text': 'HOW IT WORKS',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: '1 · Connect',
              Description: 'Securely link your bank in a couple of taps.',
              Icon: 'Link2'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: '2 · Auto-sort',
              Description: 'Tally categorizes every transaction for you.',
              Icon: 'Wand2'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: '3 · Set budgets',
              Description: 'Pick limits per category; we track them live.',
              Icon: 'SlidersHorizontal'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: '4 · Stay ahead',
              Description: 'Get a nudge before you overspend, every time.',
              Icon: 'BellRing'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Customer Stories',
              'Add Emphasis': true,
              'Emphasis Text': 'TESTIMONIALS',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Simple, honest pricing',
              Subheading: 'Start free. Upgrade only when it pays for itself.',
              'Add Emphasis': true,
              'Emphasis Text': 'PRICING',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'None'
            },
            properties: {
              Title: 'Free · $0',
              Description: 'Track spending, one budget, and manual sync. Everything you need to start.',
              'Button Label': 'Get started',
              'Card Action': 'Navigate to Page'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'None'
            },
            properties: {
              Title: 'Plus · $8/mo',
              Description: 'Unlimited budgets, automatic sync, bill reminders, and savings goals.',
              'Button Label': 'Start free trial',
              'Card Action': 'Navigate to Page'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'None'
            },
            properties: {
              Title: 'Family · $14/mo',
              Description: 'Everything in Plus for up to 5 people, with shared budgets and kid accounts.',
              'Button Label': 'Start free trial',
              'Card Action': 'Open Form'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Questions, answered',
              Subheading: 'Still curious? Reach us any time at hello@tally.app.',
              'Add Emphasis': true,
              'Emphasis Text': 'FAQ',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'list',
            variants: {
              'Image Style': 'None'
            },
            properties: {
              Items: JSON.stringify([
                {
                  title: 'Is my financial data secure?',
                  description: 'Yes — bank-level 256-bit encryption, read-only access, and we never sell your data.'
                },
                {
                  title: 'Can I cancel anytime?',
                  description: 'One tap, no fees, and you keep a full export of your data.'
                },
                {
                  title: 'Which banks are supported?',
                  description: 'Over 12,000 banks and cards across the US, UK, and Canada.'
                },
                {
                  title: 'Is there really a free plan?',
                  description: 'Always. The Free plan stays free and never asks for a card.'
                },
                {
                  title: 'Do you have a family plan?',
                  description: 'Yes — Family covers up to 5 people with shared and private budgets.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Take control of your AI customer experiences',
              'Add Emphasis': true,
              'Emphasis Text': 'GET STARTED',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Get Started',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Follow Us'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Tally, Inc. · Made in Portland, OR.',
              Shrinked: false
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Dashboard',
        icon: 'LayoutDashboard',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            properties: {
              Heading: 'This month',
              Subheading: "You're $240 under budget — nice."
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Spent',
              Description: '$1,840 across 86 transactions',
              Icon: 'Wallet',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Left to spend',
              Description: '$560 over the next 11 days',
              Icon: 'PiggyBank',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Saved',
              Description: '$300 toward your Japan trip',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Top category',
              Description: 'Groceries · $420',
              Icon: 'ShoppingCart',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'heading',
            properties: {
              Heading: 'Recent activity'
            }
          },
          {
            componentId: 'list',
            variants: {
              'Image Style': 'None',
              Size: 'Compact'
            },
            properties: {
              Items: JSON.stringify([
                {
                  title: 'Whole Foods',
                  description: 'Groceries · -$84.20'
                },
                {
                  title: 'Spotify',
                  description: 'Subscriptions · -$11.99'
                },
                {
                  title: 'Payroll',
                  description: 'Income · +$2,400.00'
                },
                {
                  title: 'Shell',
                  description: 'Transport · -$52.40'
                }
              ])
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Account',
        icon: 'User',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            properties: {
              Heading: 'Your plan',
              Subheading: 'Plus · renews May 1'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Subscription',
              Description: 'Manage or change your plan',
              Icon: 'CreditCard',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Payment method',
              Description: 'Visa ending 4242',
              Icon: 'Wallet',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Connected banks',
              Description: '3 accounts linked',
              Icon: 'Landmark',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Notifications',
              Description: 'Bills, budgets, and goals',
              Icon: 'Bell',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'button',
            variants: {
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Sign out',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-4',
        name: 'About',
        icon: 'Info',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Money should feel calm',
              Subheading: 'We’re building the budgeting app we always wanted — one that quietly does the boring parts for you.',
              'Add Emphasis': true,
              'Emphasis Text': 'ABOUT',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Tally started in 2021 around a kitchen table in Portland, after one too many late nights wrestling with spreadsheets. We thought budgeting should feel less like homework and more like a gentle nudge in the right direction. Today, Tally helps over 200,000 people spend with intention — without the guilt, the math, or the manual entry.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'What we stand for',
              'Add Emphasis': true,
              'Emphasis Text': 'WHAT WE BELIEVE',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Clarity over guilt',
              Description: 'Budgets should make you feel in control — never ashamed.',
              Icon: 'Sparkles',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Privacy by default',
              Description: 'Your data is yours. Read-only access, encrypted, never sold.',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Quietly automatic',
              Description: 'The best app is the one you barely have to open.',
              Icon: 'WandSparkles',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Independent for good',
              Description: 'No ads, no investors pulling strings — just people who pay for Tally.',
              Icon: 'Heart',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'A community that’s growing',
              'Add Emphasis': true,
              'Emphasis Text': 'BY THE NUMBERS',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '200k+',
              Description: 'people budgeting with Tally',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '$1.2B',
              Description: 'tracked every month',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '4.9★',
              Description: 'across 40k App Store reviews',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '12k+',
              Description: 'banks and cards supported',
              Icon: 'Landmark',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Come build calmer money with us',
              Subheading: 'Start free — no card, no spreadsheets.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Get started',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Tally, Inc. · Made in Portland, OR.',
              Shrinked: false
            }
          }
        ]
      },
      {
        id: 'page-5',
        name: 'Contact',
        icon: 'Mail',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'We’re here to help',
              Subheading: 'Real humans, usually back within a few hours.',
              'Add Emphasis': true,
              'Emphasis Text': 'CONTACT',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Email us',
              Description: 'hello@tally.app',
              Icon: 'Mail'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Live chat',
              Description: 'In-app, 7am–7pm PT, every day',
              Icon: 'MessageCircle'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Help center',
              Description: 'Guides, answers, and how-tos',
              Icon: 'LifeBuoy'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Visit us',
              Description: 'Portland, OR',
              Icon: 'MapPin'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Send us a note',
              Subheading: 'Tell us what’s on your mind and we’ll take it from there.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Send a message',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Follow Us'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Tally, Inc. · Made in Portland, OR.',
              Shrinked: false
            }
          }
        ]
      },
      {
        id: 'page-6',
        name: 'FAQ',
        icon: 'CircleQuestionMark',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Questions, answered',
              Subheading: 'Still curious? Email us any time at hello@tally.app.',
              'Add Emphasis': true,
              'Emphasis Text': 'FAQ',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'faq',
            variants: {
              Style: 'Divider',
              Icon: 'Chevron',
              'Icon Position': 'Right'
            },
            properties: {
              Items: JSON.stringify([
                {
                  question: 'Is my financial data secure?',
                  answer: 'Yes — bank-level 256-bit encryption, read-only access, and we never sell your data.'
                },
                {
                  question: 'Can I cancel anytime?',
                  answer: 'One tap, no fees, and you keep a full export of your data.'
                },
                {
                  question: 'Which banks are supported?',
                  answer: 'Over 12,000 banks and cards across the US, UK, and Canada.'
                },
                {
                  question: 'Is there really a free plan?',
                  answer: 'Always. The Free plan stays free and never asks for a card.'
                },
                {
                  question: 'Do you have a family plan?',
                  answer: 'Yes — Family covers up to 5 people with shared and private budgets.'
                },
                {
                  question: 'Can I use Tally on desktop and mobile?',
                  answer: 'Yes — your budgets sync instantly across iPhone, Android, and the web.'
                },
                {
                  question: 'How does Tally make money?',
                  answer: 'From simple paid plans — never by selling your data or showing ads.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Still have a question?',
              Subheading: 'We’re a quick message away.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Contact us',
              'Full Width': true
            }
          }
        ]
      }
    ],
    headerActions: [],
    appHeader: {
      layout: 'Center',
      contentAlign: 'Center',
      size: 'Large',
      minHeight: 312,
      icon: 'Leaf',
      imageStyle: 'None',
      textColor: '#FFFFFF',
      textColorMode: 'auto',
      bgSource: 'image',
      backgroundMode: 'solid',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=640&fit=crop',
      title: 'Budgeting that finally sticks.',
      subtitle: 'Tally watches your spending, builds your budget, and nudges you before you overspend.',
      show: true
    }
  },
  {
    id: 'landing-b2b',
    name: 'Landing — B2B',
    appTitle: 'Cadence',
    appSubtitle: 'Revenue intelligence for B2B sales teams',
    pages: [
      {
        id: 'page-1',
        name: 'Landing — B2B',
        icon: 'TrendingUp',
        landing: true,
        elements: [
          {
            componentId: 'button',
            properties: {
              Label: 'Book My Demo'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Your pipeline is a black box.',
              Subheading: 'Forecasts are gut calls, reps work the wrong deals, and reporting eats your week.',
              'Add Emphasis': true,
              'Emphasis Text': 'THE PROBLEM'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Forecasts you can’t trust',
              Description: 'Spreadsheets and gut feel instead of real signal.',
              Icon: 'TriangleAlert',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Reps fly blind',
              Description: 'No clear view of which deals to push today.',
              Icon: 'EyeOff',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Deals slip silently',
              Description: 'Risk only shows up after the deal is already lost.',
              Icon: 'TrendingDown',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Reporting eats hours',
              Description: 'Rebuilding the same board by hand every week.',
              Icon: 'Clock',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'One platform for the whole funnel.',
              Subheading: 'Pipeline, forecasting, and coaching in one place — synced to your CRM.',
              'Add Emphasis': true,
              'Emphasis Text': 'THE SOLUTION'
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=500&fit=crop',
              'Alt Text': 'The Cadence revenue dashboard'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Pipeline analytics',
              Description: 'See every deal’s health and stage velocity.',
              Icon: 'BarChart3',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'AI forecasting',
              Description: 'Roll-ups you can defend, updated daily.',
              Icon: 'Sparkles',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Deal alerts',
              Description: 'Get pinged the moment a deal goes quiet.',
              Icon: 'BellRing',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Rep scorecards',
              Description: 'Coach with activity and outcome metrics.',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Revenue reporting',
              Description: 'Board-ready reports without the rebuild.',
              Icon: 'FileText',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'CRM sync',
              Description: 'Two-way sync with Salesforce and HubSpot.',
              Icon: 'RefreshCw',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Featured Case Studies'
            }
          },
          {
            componentId: 'card',
            variants: {
              Layout: 'Vertical',
              Action: 'Button'
            },
            properties: {
              Title: 'Northwind, Inc.',
              Description: '“Cadence gave us a forecast the board actually trusts — and our reps finally know where to spend their day.”  — VP of Sales',
              'Button Label': 'Read More',
              'Image URL': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=700&h=380&fit=crop',
              'Card Action': 'Open Form'
            }
          },
          {
            componentId: 'card',
            variants: {
              Layout: 'Vertical',
              Action: 'Button'
            },
            properties: {
              Title: 'Meridian Logistics',
              Description: 'Cadence turned our pipeline guesswork into a number finance signs off on every quarter',
              'Button Label': 'Read More',
              'Card Action': 'Open Form',
              'Image URL': 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=700&h=380&fit=crop'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Loved by revenue leaders.',
              Subheading: 'What sales and RevOps teams say after a quarter on Cadence.',
              'Add Emphasis': true,
              'Emphasis Text': 'TESTIMONIALS'
            }
          },
          {
            componentId: 'testimonial',
            variants: {
              Layout: 'Grid'
            },
            properties: {
              'Show Avatars': true,
              Items: JSON.stringify([
                { name: 'Marcus Bell', role: 'VP of Sales, Northwind', rating: 5, text: '“Cadence gave us a forecast the board actually trusts — and our reps finally know which deals to work first.”', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
                { name: 'Priya Nair', role: 'RevOps Lead, Stacker', rating: 5, text: '“We cut forecast prep from two days to ten minutes — and the accuracy went up, not down.”', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
                { name: 'Tom Whitfield', role: 'Head of Revenue, Loop', rating: 5, text: '“Pipeline reviews used to be guesswork. Now every number is backed by data finance signs off on.”', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
                { name: 'Elena Brandt', role: 'Sales Director, Vista', rating: 4, text: '“Onboarding our 24-person team took an afternoon. Adoption across the floor was immediate.”', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Questions, answered.',
              Subheading: 'Still curious? Talk to us at sales@cadence.io.',
              'Add Emphasis': true,
              'Emphasis Text': 'FAQ'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'list',
            variants: {
              'Image Style': 'None',
              'Card Image Style': 'None'
            },
            properties: {
              Items: JSON.stringify([
                {
                  title: 'How long is setup?',
                  description: 'Most teams are live in under a week with native CRM sync.'
                },
                {
                  title: 'Which CRMs do you support?',
                  description: 'Two-way sync with Salesforce and HubSpot today, more coming.'
                },
                {
                  title: 'Is our data secure?',
                  description: 'SOC 2 Type II, SSO/SAML, and encryption in transit and at rest.'
                },
                {
                  title: 'Do you help with onboarding?',
                  description: 'Every plan includes a dedicated onboarding specialist.'
                },
                {
                  title: 'How is pricing structured?',
                  description: 'Per seat, billed annually, with volume discounts for larger teams.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'See Cadence on your pipeline.',
              Subheading: 'Book a 20-minute demo and we’ll show you your own funnel, clarified.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Book a demo',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 19
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Cadence'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Cadence, Inc. · SOC 2 Type II certified.'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Dashboard',
        icon: 'LayoutDashboard',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            properties: {
              Heading: 'This quarter',
              Subheading: 'Pipeline is pacing 112% to plan.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '$4.8M',
              Description: 'qualified pipeline',
              Icon: 'BarChart3',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '112%',
              Description: 'to quarterly plan',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '38 days',
              Description: 'avg deal cycle',
              Icon: 'Timer',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '7 at risk',
              Description: 'deals flagged this week',
              Icon: 'TriangleAlert',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'heading',
            properties: {
              Heading: 'Deals to work today'
            }
          },
          {
            componentId: 'list',
            variants: {
              'Image Style': 'None',
              Size: 'Compact'
            },
            properties: {
              Items: JSON.stringify([
                {
                  title: 'Globex — Renewal',
                  description: '$120k · Negotiation · slipping'
                },
                {
                  title: 'Initech — Expansion',
                  description: '$64k · Proposal · on track'
                },
                {
                  title: 'Umbra — New logo',
                  description: '$210k · Discovery · quiet 6 days'
                },
                {
                  title: 'Hooli — Upsell',
                  description: '$48k · Closing · ready to sign'
                }
              ])
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Account',
        icon: 'User',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            properties: {
              Heading: 'Your workspace',
              Subheading: 'Cadence Team · 24 seats'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Plan & billing',
              Description: 'Team plan, renews May 1',
              Icon: 'CreditCard',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Integrations',
              Description: 'Salesforce · HubSpot connected',
              Icon: 'RefreshCw',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Team',
              Description: 'Invite reps and managers',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Security',
              Description: 'SSO, SAML, and audit log',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'button',
            variants: {
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Sign out',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-4',
        name: 'About',
        icon: 'Info',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'We turn CRM noise into revenue signal',
              Subheading: 'Cadence helps revenue teams forecast with confidence and coach with data.',
              'Add Emphasis': true,
              'Emphasis Text': 'ABOUT'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Cadence was founded in 2020 by a team of RevOps and sales leaders tired of forecasts built on gut feel. We’d lived the Monday pipeline reviews, the spreadsheet rebuilds, and the quarters that slipped without warning. So we built the system we wished we’d had: one place where every deal’s health is visible, every forecast is defensible, and every rep knows exactly where to spend their day.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'How we think',
              'Add Emphasis': true,
              'Emphasis Text': 'WHAT DRIVES US'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Signal over noise',
              Description: 'Every metric earns its place — or it’s gone.',
              Icon: 'Sparkles',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Defensible by design',
              Description: 'Numbers your board and finance can trust.',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Built for RevOps',
              Description: 'Made with the people who live in the pipeline.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'Adoption first',
              Description: 'If reps won’t use it, it doesn’t ship.',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Trusted by revenue teams',
              'Add Emphasis': true,
              'Emphasis Text': 'BY THE NUMBERS'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '$12B+',
              Description: 'pipeline managed on Cadence',
              Icon: 'ChartColumn',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '1,400+',
              Description: 'revenue teams',
              Icon: 'Building2',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: '27%',
              Description: 'average lift in forecast accuracy',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical'
            },
            properties: {
              Title: 'SOC 2',
              Description: 'Type II certified',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'See Cadence on your pipeline.',
              Subheading: 'Book a 20-minute demo and we’ll show you your own funnel, clarified.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Book a demo',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 19
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Cadence'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Cadence, Inc. · SOC 2 Type II certified.'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          }
        ]
      },
      {
        id: 'page-5',
        name: 'Contact',
        icon: 'Mail',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Talk to our team',
              Subheading: 'Sales, support, or partnerships — we’ll route you to the right person.',
              'Add Emphasis': true,
              'Emphasis Text': 'CONTACT'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Talk to sales',
              Description: 'sales@cadence.io',
              Icon: 'Mail'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Customer support',
              Description: 'support@cadence.io · 24/5',
              Icon: 'LifeBuoy'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Partnerships',
              Description: 'partners@cadence.io',
              Icon: 'Handshake'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon'
            },
            properties: {
              Title: 'Headquarters',
              Description: 'Austin, TX',
              Icon: 'MapPin'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Book a demo',
              Subheading: 'Twenty minutes, your pipeline, zero slides.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Book a demo',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Cadence'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Cadence, Inc. · SOC 2 Type II certified.'
            }
          }
        ]
      },
      {
        id: 'page-6',
        name: 'FAQ',
        icon: 'CircleQuestionMark',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Questions, answered',
              Subheading: 'Still curious? Talk to us at sales@cadence.io.',
              'Add Emphasis': true,
              'Emphasis Text': 'FAQ'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'faq',
            variants: {
              Style: 'Divider',
              Icon: 'Chevron',
              'Icon Position': 'Right'
            },
            properties: {
              Items: JSON.stringify([
                {
                  question: 'How long is setup?',
                  answer: 'Most teams are live in under a week with native CRM sync.'
                },
                {
                  question: 'Which CRMs do you support?',
                  answer: 'Two-way sync with Salesforce and HubSpot today, with more on the way.'
                },
                {
                  question: 'Is our data secure?',
                  answer: 'SOC 2 Type II, SSO/SAML, and encryption in transit and at rest.'
                },
                {
                  question: 'Do you help with onboarding?',
                  answer: 'Every plan includes a dedicated onboarding specialist.'
                },
                {
                  question: 'How is pricing structured?',
                  answer: 'Per seat, billed annually, with volume discounts for larger teams.'
                },
                {
                  question: 'Can we keep our existing reports?',
                  answer: 'Yes — Cadence layers on top of your CRM without replacing it.'
                },
                {
                  question: 'Do you offer a trial?',
                  answer: 'We run a guided 14-day pilot on your own pipeline data.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Still evaluating?',
              Subheading: 'We’ll walk you through it on your own data.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Corner: 'Rounded',
              Width: 'Auto'
            },
            properties: {
              Label: 'Book a demo',
              'Full Width': true
            }
          }
        ]
      }
    ],
    headerActions: [],
    appHeader: {
      layout: 'Center',
      contentAlign: 'Center',
      size: 'Large',
      minHeight: 320,
      icon: 'Leaf',
      imageStyle: 'None',
      textColor: '#FFFFFF',
      textColorMode: 'auto',
      bgSource: 'image',
      backgroundMode: 'solid',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1665686308827-eb62e4f6604d?w=1200&h=640&fit=crop',
      title: 'Stop guessing your pipeline.',
      subtitle: 'Cadence turns your CRM into forecasts you can trust — and shows reps exactly which deals to work today.',
      show: true
    }
  },
  {
    id: 'landing-club',
    name: 'Landing — Club',
    appTitle: 'Rally',
    appSubtitle: 'Club & studio management, handled',
    pages: [
      {
        id: 'page-1',
        name: 'Landing — Club',
        icon: 'Trophy',
        landing: true,
        elements: [
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Try it free',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Powering 2,000+ clubs and studios',
              Subheading: ''
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2,000+ clubs',
              Description: 'and studios run on Rally',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '10 min',
              Description: 'to set up your first season',
              Icon: 'Zap',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '+38% members',
              Description: 'average growth in year one',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4.9 stars',
              Description: 'from 1,800+ coaches',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'image',
            variants: {
              'Has Image': 'Yes',
              Alignment: 'Center',
              Size: 'Large'
            },
            properties: {
              'Image URL': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&h=500&fit=crop',
              'Alt Text': 'Coaches and members training together at a Rally club'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Everything you need to run the club',
              Subheading: 'From the first sign-up to the season finale.',
              'Add Emphasis': true,
              'Emphasis Text': 'FEATURES',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Online booking',
              Description: 'Let members register and book online in a few taps.',
              Icon: 'CalendarCheck'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Payments on autopilot',
              Description: 'Collect payments and chase dues automatically.',
              Icon: 'CreditCard'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Built-in messaging',
              Description: 'Keep parents and members in the loop with built-in messaging.',
              Icon: 'MessageCircle'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'And a lot less busywork.',
              Subheading: 'The little things that used to eat your evenings.',
              'Add Emphasis': true,
              'Emphasis Text': 'ALSO INCLUDED',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Smart scheduling',
              Description: 'Practices, classes, and games in one calendar.',
              Icon: 'Calendar',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Attendance & check-in',
              Description: 'Tap to check members in; spot no-shows fast.',
              Icon: 'QrCode',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Roster & roles',
              Description: 'Coaches, parents, and admins each see their own view.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Reports that matter',
              Description: 'Revenue, attendance, and growth at a glance.',
              Icon: 'BarChart3',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Soccer, studios, dojos, and more.',
              Subheading: 'If you run a roster, Rally fits.',
              'Add Emphasis': true,
              'Emphasis Text': 'EVERY KIND OF CLUB',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'image-gallery',
            variants: {
              Layout: '4'
            },
            properties: {
              Images: JSON.stringify([
                'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=400&fit=crop'
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Up and running in an afternoon.',
              Subheading: 'No spreadsheets, no clipboard, no IT.',
              'Add Emphasis': true,
              'Emphasis Text': 'HOW IT WORKS',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '1 · Import your roster',
              Description: 'Bring members in from a spreadsheet or an invite link.',
              Icon: 'Upload',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2 · Set your schedule',
              Description: 'Add classes, practices, and prices in minutes.',
              Icon: 'Calendar',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 · Open registration',
              Description: 'Share one link; members sign up and pay.',
              Icon: 'Link2',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4 · Coach, not chase',
              Description: 'Rally handles dues, reminders, and updates.',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Loved by coaches and members.',
              Subheading: 'Clubs that switched to Rally grew faster with less admin.',
              'Add Emphasis': true,
              'Emphasis Text': 'MEMBER STORIES',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'testimonial',
            properties: {
              'Show Avatars': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Get your evenings back.',
              Subheading: 'Start free today — no card, no setup fees, cancel anytime.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Try it free',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'See a 2-min tour',
              'Left Icon': 'none',
              'Right Icon': 'none',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Rally',
              Subheading: ''
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Rally, Inc. · Made for coaches.'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          }
        ]
      },
      {
        id: 'page-2',
        name: 'Dashboard',
        icon: 'LayoutDashboard',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'This week',
              Subheading: 'Two practices, one game, and 6 new sign-ups.'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '184 members',
              Description: '+12 this month',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '$4,260',
              Description: 'collected this week',
              Icon: 'CreditCard',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '92%',
              Description: 'attendance rate',
              Icon: 'QrCode',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '3 dues',
              Description: 'still outstanding',
              Icon: 'Bell',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: "Today's schedule",
              Subheading: ''
            }
          },
          {
            componentId: 'list',
            variants: {
              Layout: 'Basic',
              'Image Style': 'None',
              Size: 'Compact',
              Action: 'None'
            },
            properties: {
              'Show Header': false,
              Items: JSON.stringify([
                {
                  title: 'U12 Practice',
                  description: '4:00 PM · Field 2 · Coach Mara'
                },
                {
                  title: 'Adult Yoga',
                  description: '6:00 PM · Studio A · 14 booked'
                },
                {
                  title: 'U16 Game vs. Northside',
                  description: '7:30 PM · Main Field'
                }
              ])
            }
          }
        ]
      },
      {
        id: 'page-3',
        name: 'Account',
        icon: 'User',
        requireLogin: true,
        elements: [
          {
            componentId: 'heading',
            variants: {
              Size: 'Medium',
              Alignment: 'Left'
            },
            properties: {
              Heading: 'Your club',
              Subheading: 'Riverside Athletic · Pro plan'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Billing',
              Description: 'Pro plan, renews May 1',
              Icon: 'CreditCard',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Team & roles',
              Description: 'Invite coaches and admins',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Forms & waivers',
              Description: '3 templates active',
              Icon: 'ClipboardCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Notifications',
              Description: 'Dues, practices, and forms',
              Icon: 'Bell',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 16
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Sign out',
              'Left Icon': 'none',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      },
      {
        id: 'page-4',
        name: 'About',
        icon: 'Info',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Built by coaches, for coaches',
              Subheading: 'We handle the busywork so you can get back to the field.',
              'Add Emphasis': true,
              'Emphasis Text': 'ABOUT',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Medium',
              Alignment: 'Center'
            },
            properties: {
              Text: 'Rally began on the sidelines. Our founders spent years coaching youth soccer and running a martial-arts studio — and losing their evenings to spreadsheets, group texts, and unpaid dues. They knew there had to be a better way to run a club. Today, Rally powers over 2,000 clubs and studios, helping coaches spend less time on admin and more time doing what they love.'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'What we stand for',
              'Add Emphasis': true,
              'Emphasis Text': 'WHAT WE BELIEVE',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Coaching first',
              Description: 'Every feature gives you time back for your members.',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'No one left out',
              Description: 'Coaches, parents, and admins each get a view that fits.',
              Icon: 'Users',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Fair and simple',
              Description: 'Honest pricing, no setup fees, cancel anytime.',
              Icon: 'Heart',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Built to last',
              Description: 'Independent and here for the long season.',
              Icon: 'ShieldCheck',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'A growing community',
              'Add Emphasis': true,
              'Emphasis Text': 'BY THE NUMBERS',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '2,000+',
              Description: 'clubs and studios',
              Icon: 'Trophy',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '+38%',
              Description: 'average member growth in year one',
              Icon: 'TrendingUp',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '4.9★',
              Description: 'from 1,800+ coaches',
              Icon: 'Star',
              Shrinked: true
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Vertical',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: '1M+',
              Description: 'check-ins every season',
              Icon: 'QrCode',
              Shrinked: true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Run your club the easy way',
              Subheading: 'Start free today — no card, cancel anytime.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Try it free',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Rally',
              Subheading: ''
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Rally, Inc. · Made for coaches.'
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          }
        ]
      },
      {
        id: 'page-5',
        name: 'Contact',
        icon: 'Mail',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'We’d love to hear from you',
              Subheading: 'Questions, demos, or just saying hi — we’re here.',
              'Add Emphasis': true,
              'Emphasis Text': 'CONTACT',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Email us',
              Description: 'hello@rally.club',
              Icon: 'Mail'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Live chat',
              Description: 'In-app, 8am–8pm, Mon–Sat',
              Icon: 'MessageCircle'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Book a demo',
              Description: 'See Rally on your club in 15 minutes',
              Icon: 'CalendarCheck'
            }
          },
          {
            componentId: 'card',
            variants: {
              'Image Style': 'Icon',
              Layout: 'Horizontal',
              Action: 'None',
              'Icon Filled': 'No'
            },
            properties: {
              Title: 'Visit us',
              Description: 'Denver, CO',
              Icon: 'MapPin'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Send us a message',
              Subheading: 'Tell us about your club and we’ll be right with you.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Default',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Send a message',
              'Left Icon': 'none',
              'Right Icon': 'ArrowRight',
              'Full Width': true
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 24
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Rally',
              Subheading: ''
            }
          },
          {
            componentId: 'social-follow',
            variants: {
              Layout: 'Wrap',
              Variant: 'Secondary',
              Filled: 'No'
            }
          },
          {
            componentId: 'paragraph',
            variants: {
              Size: 'Small',
              Alignment: 'Center'
            },
            properties: {
              Text: '© 2026 Rally, Inc. · Made for coaches.'
            }
          }
        ]
      },
      {
        id: 'page-6',
        name: 'FAQ',
        icon: 'CircleQuestionMark',
        elements: [
          {
            componentId: 'spacer',
            properties: {
              Height: 4
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Questions, answered',
              Subheading: 'Still curious? Email us any time at hello@rally.club.',
              'Add Emphasis': true,
              'Emphasis Text': 'FAQ',
              'Emphasis Style': 'Badge'
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 8
            }
          },
          {
            componentId: 'faq',
            variants: {
              Style: 'Divider',
              Icon: 'Chevron',
              'Icon Position': 'Right'
            },
            properties: {
              Items: JSON.stringify([
                {
                  question: 'How long does setup take?',
                  answer: 'Most clubs are up and running in an afternoon — import your roster, set a schedule, and open registration.'
                },
                {
                  question: 'Do my members need to download an app?',
                  answer: 'No — members register, book, and pay from any browser. A mobile app is optional.'
                },
                {
                  question: 'How do payments work?',
                  answer: 'Rally collects dues and one-off payments automatically, and chases late ones for you.'
                },
                {
                  question: 'Can I manage more than one team or location?',
                  answer: 'Yes — run multiple teams, classes, and locations from a single account.'
                },
                {
                  question: 'Is there a setup fee?',
                  answer: 'Never. Start free, and only pay as your club grows.'
                },
                {
                  question: 'What sports and activities does Rally support?',
                  answer: 'Soccer, studios, dojos, dance, and more — if you run a roster, Rally fits.'
                },
                {
                  question: 'Can parents and coaches have different access?',
                  answer: 'Yes — coaches, parents, and admins each see a view tailored to their role.'
                }
              ])
            }
          },
          {
            componentId: 'spacer',
            properties: {
              Height: 32
            }
          },
          {
            componentId: 'heading',
            variants: {
              Size: 'Large',
              Alignment: 'Center'
            },
            properties: {
              Heading: 'Still have questions?',
              Subheading: 'We’re a quick message away.'
            }
          },
          {
            componentId: 'button',
            variants: {
              Type: 'Standard',
              Variant: 'Outlined',
              Corner: 'Rounded'
            },
            properties: {
              Label: 'Contact us',
              'Left Icon': 'none',
              'Right Icon': 'none',
              'Full Width': true
            }
          }
        ]
      }
    ],
    headerActions: [],
    appHeader: {
      layout: 'Center',
      contentAlign: 'Center',
      size: 'Large',
      minHeight: 320,
      icon: 'Trophy',
      imageStyle: 'None',
      textColor: '#FFFFFF',
      textColorMode: 'auto',
      bgSource: 'image',
      backgroundMode: 'solid',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=640&fit=crop',
      title: 'Run your club without the clipboard.',
      subtitle: 'Bookings, payments, and member updates — handled, so you can get back to coaching.',
      show: true
    },
    theme: {
      color: '#19A44B',
      tint: 40,
      font: 'Geist',
      headingFont: 'Hanken Grotesk',
      radius: 'Small',
      harmonyOffset: 120,
      activePreset: 'Forest',
      colorMode: 'dark',
      tokenOverrides: {

      }
    }
  },
]

export function getPresetById(id: string): AppPreset {
  return APP_PRESETS.find((p) => p.id === id) ?? APP_PRESETS[0]
}
