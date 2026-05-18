import { useEffect, useRef, useState, type FC, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon';
import { Button } from '../Button';
import './AttributionBar.scss';

const openExternal = (href: string) => {
  window.open(href, '_blank', 'noopener,noreferrer');
};

type PreviewMode = 'phone' | 'tablet' | 'desktop';

const CONTAINER_MODE_MAP: Record<string, PreviewMode> = {
  'live-preview__phone-screen': 'phone',
  'live-preview__tablet-screen': 'tablet',
  'app-preview-screen__desktop': 'desktop',
};

const findPreviewContainer = (
  start: HTMLElement | null,
): { container: HTMLElement; mode: PreviewMode } | null => {
  let el: HTMLElement | null = start;
  while (el) {
    for (const cls of Object.keys(CONTAINER_MODE_MAP)) {
      if (el.classList.contains(cls)) {
        return { container: el, mode: CONTAINER_MODE_MAP[cls] };
      }
    }
    el = el.parentElement;
  }
  return null;
};

export interface AttributionBarProps {
  aiHref?: string;
  templatesHref?: string;
  upgradeHref?: string;
  openAiSheetOnMount?: boolean;
}

interface PromptSuggestion {
  label: string;
  prompt: string;
}

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { label: 'Online store', prompt: 'An online store for selling handmade products with cart and checkout' },
  { label: 'Event signup', prompt: 'A signup form for an upcoming workshop with date and capacity' },
  { label: 'Lead capture', prompt: 'A lead capture form for new customers with email and phone' },
  { label: 'Booking app', prompt: 'A booking app for a service business with calendar and time slots' },
];

const JotformBrandLogo: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="148"
    height="28"
    viewBox="0 0 148 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Jotform"
  >
    <path d="M19.2944 3.93418C20.5996 2.62855 22.7158 2.62855 24.021 3.93418C25.3262 5.23982 25.3262 7.35668 24.021 8.66232L12.2045 20.4826C10.8993 21.7883 8.78315 21.7883 7.47793 20.4826C6.17272 19.177 6.17272 17.0601 7.47793 15.7545L19.2944 3.93418Z" fill="#FF6100" />
    <path d="M9.25045 0.979228C10.5557 -0.326409 12.6718 -0.326409 13.977 0.979228C15.2823 2.28487 15.2823 4.40172 13.977 5.70736L5.7055 13.9816C4.40029 15.2872 2.28412 15.2872 0.97891 13.9816C-0.326303 12.676 -0.326303 10.5591 0.97891 9.25346L9.25045 0.979228Z" fill="#0099FF" />
    <path d="M18.7036 17.5276C20.0088 16.2219 22.1249 16.2219 23.4301 17.5276C24.7354 18.8332 24.7354 20.9501 23.4301 22.2557L18.7036 26.9838C17.3983 28.2895 15.2822 28.2895 13.977 26.9838C12.6717 25.6782 12.6717 23.5613 13.977 22.2557L18.7036 17.5276Z" fill="#FFB629" />
    <path d="M1.6711 28H6.33832C7.08271 28 7.45551 27.0997 6.92914 26.5732L1.42638 21.0686C0.900008 20.5421 0 20.915 0 21.6596V26.3284C0 27.2516 0.748178 28 1.6711 28Z" fill="currentColor" />
    <path d="M91.2506 6.01921L91.5071 6.0956V2.37041L91.3892 2.31452C91.2085 2.22895 90.9178 2.15148 90.5823 2.09509C90.2423 2.03796 89.8414 2 89.4327 2C87.8404 2 86.0502 2.54903 85.1233 3.53812C84.1969 4.52669 83.686 5.93569 83.686 7.62146V8.40849H81.3587V12.6848H83.686V25.6848H88.3569V12.6848H91.5071V8.40849H88.3569V7.68061C88.3569 6.92309 88.6111 6.48702 88.9362 6.23301C89.2715 5.971 89.712 5.87943 90.1139 5.87943C90.7181 5.87943 91.0685 5.96501 91.2506 6.01921Z" fill="currentColor" />
    <path d="M37.8467 17.6275L33 17.6275L33.003 17.8136C33.041 20.1773 33.8989 22.1227 35.3353 23.4856C36.8057 24.8808 38.9024 25.6848 41.4029 25.6848C46.4083 25.6848 49.914 21.9766 49.914 17.5426V3.69177H44.6738V17.4007C44.6738 18.3903 44.3749 19.2633 43.801 19.8927C43.2237 20.5258 42.3881 20.89 41.3664 20.89C40.529 20.89 39.7255 20.651 39.1045 20.1375C38.4804 19.6215 38.0634 18.8469 37.9694 17.8198C37.9643 17.7643 37.9388 17.7146 37.9018 17.6796L37.8467 17.6275Z" fill="currentColor" />
    <path d="M128.34 25.6847H123.475V9.16023H128.149V10.4888C129.226 9.35176 130.936 8.76697 132.413 8.76697C134.439 8.76697 136.153 9.573 137.092 11.0973C137.671 10.326 138.336 9.76747 139.086 9.39097C139.968 8.94861 140.951 8.76697 142.02 8.76697C143.529 8.76697 145.027 9.22438 146.152 10.2542C147.281 11.2891 148 12.8711 148 15.0504V25.6847H143.262V15.9119C143.262 15.1129 143.066 14.4533 142.681 13.9984C142.303 13.5523 141.707 13.261 140.811 13.261C139.993 13.261 139.357 13.575 138.922 14.0673C138.483 14.5639 138.234 15.2598 138.234 16.0395V25.6847H133.4V15.9119C133.4 15.1155 133.198 14.4555 132.808 13.9995C132.425 13.5515 131.828 13.261 130.95 13.261C130.111 13.261 129.468 13.57 129.031 14.0571C128.59 14.5483 128.34 15.2428 128.34 16.0395V25.6847Z" fill="currentColor" />
    <path fillRule="evenodd" clipRule="evenodd" d="M100.934 8.76709C96.1218 8.76709 92.477 12.3085 92.477 17.226C92.477 22.1114 96.121 25.6848 100.934 25.6848C105.747 25.6848 109.391 22.1114 109.391 17.226C109.391 12.3085 105.746 8.76709 100.934 8.76709ZM100.934 21.2789C99.9864 21.2789 99.0839 20.9335 98.4186 20.2648C97.7554 19.5983 97.3074 18.5896 97.3074 17.226C97.3074 15.8459 97.7558 14.8379 98.418 14.176C99.0824 13.5118 99.9846 13.173 100.934 13.173C101.883 13.173 102.786 13.5118 103.45 14.176C104.112 14.8379 104.561 15.8459 104.561 17.226C104.561 18.606 104.112 19.614 103.45 20.276C102.786 20.9401 101.883 21.2789 100.934 21.2789Z" fill="currentColor" />
    <path fillRule="evenodd" clipRule="evenodd" d="M60.2417 8.7671C55.4294 8.7671 51.7847 12.3085 51.7847 17.226C51.7847 22.1114 55.4286 25.6848 60.2417 25.6848C65.0548 25.6848 68.6987 22.1114 68.6987 17.226C68.6987 12.3085 65.054 8.7671 60.2417 8.7671ZM60.2417 21.279C59.2941 21.279 58.3916 20.9335 57.7263 20.2649C57.063 19.5983 56.6151 18.5896 56.6151 17.226C56.6151 15.8459 57.0635 14.8379 57.7257 14.176C58.3901 13.5118 59.2923 13.173 60.2417 13.173C61.1911 13.173 62.0934 13.5118 62.7577 14.176C63.4199 14.8379 63.8683 15.8459 63.8683 17.226C63.8683 18.606 63.4199 19.614 62.7577 20.276C62.0934 20.9401 61.1911 21.279 60.2417 21.279Z" fill="currentColor" />
    <path d="M121.601 8.863V13.9058L121.222 13.8279C120.768 13.735 120.377 13.7042 120.016 13.7042C118.984 13.7042 118.067 13.9611 117.409 14.5849C116.756 15.2047 116.305 16.2365 116.305 17.9013V25.6848H111.453V8.84861H116.178V10.4736C117.347 9.04468 119.162 8.76709 120.301 8.76709C120.666 8.76709 120.996 8.80098 121.31 8.83315L121.601 8.863Z" fill="currentColor" />
    <path d="M79.9561 21.5867L79.6993 21.6631C79.517 21.7173 79.1663 21.803 78.5615 21.803C78.1592 21.803 77.7183 21.7113 77.3827 21.4492C77.0573 21.195 76.8028 20.7587 76.8028 20.0007V12.5373L79.9561 12.5373V8.29497H76.8028V3.69177H72.1372V8.29497L69.8077 8.29497L69.8077 12.5373H72.1372V20.0598C72.1372 21.7467 72.6485 23.1565 73.5758 24.1457C74.5036 25.1354 76.2859 25.6848 77.8797 25.6848C78.2887 25.6848 78.6901 25.6468 79.0303 25.5897C79.3662 25.5332 79.6571 25.4557 79.838 25.3701L79.9561 25.3142V21.5867Z" fill="currentColor" />
  </svg>
);

const JotformAiLogo: FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`attribution-modal__brand-logo${className ? ` ${className}` : ''}`}
    viewBox="0 0 98 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Jotform AI"
  >
    <path
      d="M0.4 14.74L3.06 14.26V15.56C3.07333 16.2933 3.26 16.8333 3.62 17.18C3.99333 17.5133 4.46 17.68 5.02 17.68C5.60667 17.68 6.06667 17.4933 6.4 17.12C6.73333 16.7467 6.9 16.2467 6.9 15.62V5.82H9.66V15.62C9.66 16.26 9.54667 16.8667 9.32 17.44C9.10667 18 8.79333 18.4933 8.38 18.92C7.98 19.3467 7.49333 19.6867 6.92 19.94C6.36 20.18 5.73333 20.3 5.04 20.3C4.33333 20.3 3.69333 20.1933 3.12 19.98C2.56 19.7533 2.07333 19.44 1.66 19.04C1.26 18.6267 0.946667 18.14 0.72 17.58C0.506667 17.0067 0.4 16.3733 0.4 15.68V14.74ZM16.8752 17.88C17.1952 17.88 17.5085 17.82 17.8152 17.7C18.1218 17.58 18.3885 17.4067 18.6152 17.18C18.8418 16.94 19.0218 16.6467 19.1552 16.3C19.3018 15.9533 19.3752 15.5467 19.3752 15.08C19.3752 14.6133 19.3018 14.2067 19.1552 13.86C19.0218 13.5133 18.8418 13.2267 18.6152 13C18.3885 12.76 18.1218 12.58 17.8152 12.46C17.5085 12.34 17.1952 12.28 16.8752 12.28C16.5552 12.28 16.2418 12.34 15.9352 12.46C15.6285 12.58 15.3618 12.76 15.1352 13C14.9085 13.2267 14.7218 13.5133 14.5752 13.86C14.4418 14.2067 14.3752 14.6133 14.3752 15.08C14.3752 15.5467 14.4418 15.9533 14.5752 16.3C14.7218 16.6467 14.9085 16.94 15.1352 17.18C15.3618 17.4067 15.6285 17.58 15.9352 17.7C16.2418 17.82 16.5552 17.88 16.8752 17.88ZM16.8752 9.86C17.6085 9.86 18.2885 9.99333 18.9152 10.26C19.5552 10.5133 20.1018 10.8733 20.5552 11.34C21.0218 11.7933 21.3818 12.34 21.6352 12.98C21.9018 13.62 22.0352 14.32 22.0352 15.08C22.0352 15.84 21.9018 16.54 21.6352 17.18C21.3818 17.8067 21.0218 18.3533 20.5552 18.82C20.1018 19.2867 19.5552 19.6533 18.9152 19.92C18.2885 20.1733 17.6085 20.3 16.8752 20.3C16.1418 20.3 15.4552 20.1733 14.8152 19.92C14.1885 19.6533 13.6418 19.2867 13.1752 18.82C12.7218 18.3533 12.3618 17.8067 12.0952 17.18C11.8418 16.54 11.7152 15.84 11.7152 15.08C11.7152 14.32 11.8418 13.62 12.0952 12.98C12.3618 12.34 12.7218 11.7933 13.1752 11.34C13.6418 10.8733 14.1885 10.5133 14.8152 10.26C15.4552 9.99333 16.1418 9.86 16.8752 9.86ZM27.3758 10.16H29.3558V12.52H27.3758V16.64C27.3758 17.0667 27.4691 17.3667 27.6558 17.54C27.8558 17.7 28.1491 17.78 28.5358 17.78C28.6958 17.78 28.8558 17.7733 29.0158 17.76C29.1758 17.7467 29.2891 17.7267 29.3558 17.7V19.9C29.2358 19.9533 29.0491 20.0067 28.7958 20.06C28.5558 20.1133 28.2424 20.14 27.8558 20.14C26.8958 20.14 26.1358 19.8733 25.5758 19.34C25.0158 18.8067 24.7358 18.06 24.7358 17.1V12.52H22.9558V10.16H23.4558C23.9758 10.16 24.3558 10.0133 24.5958 9.72C24.8491 9.41333 24.9758 9.04 24.9758 8.6V7.22H27.3758V10.16ZM36.1167 7.72C35.9701 7.72 35.8101 7.74 35.6367 7.78C35.4767 7.82 35.3301 7.89333 35.1967 8C35.0634 8.09333 34.9501 8.22667 34.8567 8.4C34.7767 8.57333 34.7367 8.8 34.7367 9.08V10.16H36.9567V12.44H34.7367V20H32.0567V12.44H30.4167V10.16H32.0567V9.04C32.0567 8.48 32.1367 7.98 32.2967 7.54C32.4701 7.08667 32.7101 6.7 33.0167 6.38C33.3367 6.06 33.7167 5.81333 34.1567 5.64C34.5967 5.46667 35.0901 5.38 35.6367 5.38C35.9167 5.38 36.1767 5.4 36.4167 5.44C36.6701 5.48 36.8501 5.52667 36.9567 5.58V7.82C36.8901 7.79333 36.7901 7.77333 36.6567 7.76C36.5234 7.73333 36.3434 7.72 36.1167 7.72ZM42.8908 17.88C43.2108 17.88 43.5241 17.82 43.8308 17.7C44.1374 17.58 44.4041 17.4067 44.6308 17.18C44.8574 16.94 45.0374 16.6467 45.1708 16.3C45.3174 15.9533 45.3908 15.5467 45.3908 15.08C45.3908 14.6133 45.3174 14.2067 45.1708 13.86C45.0374 13.5133 44.8574 13.2267 44.6308 13C44.4041 12.76 44.1374 12.58 43.8308 12.46C43.5241 12.34 43.2108 12.28 42.8908 12.28C42.5708 12.28 42.2574 12.34 41.9508 12.46C41.6441 12.58 41.3774 12.76 41.1508 13C40.9241 13.2267 40.7374 13.5133 40.5908 13.86C40.4574 14.2067 40.3908 14.6133 40.3908 15.08C40.3908 15.5467 40.4574 15.9533 40.5908 16.3C40.7374 16.6467 40.9241 16.94 41.1508 17.18C41.3774 17.4067 41.6441 17.58 41.9508 17.7C42.2574 17.82 42.5708 17.88 42.8908 17.88ZM42.8908 9.86C43.6241 9.86 44.3041 9.99333 44.9308 10.26C45.5708 10.5133 46.1174 10.8733 46.5708 11.34C47.0374 11.7933 47.3974 12.34 47.6508 12.98C47.9174 13.62 48.0508 14.32 48.0508 15.08C48.0508 15.84 47.9174 16.54 47.6508 17.18C47.3974 17.8067 47.0374 18.3533 46.5708 18.82C46.1174 19.2867 45.5708 19.6533 44.9308 19.92C44.3041 20.1733 43.6241 20.3 42.8908 20.3C42.1574 20.3 41.4708 20.1733 40.8308 19.92C40.2041 19.6533 39.6574 19.2867 39.1908 18.82C38.7374 18.3533 38.3774 17.8067 38.1108 17.18C37.8574 16.54 37.7308 15.84 37.7308 15.08C37.7308 14.32 37.8574 13.62 38.1108 12.98C38.3774 12.34 38.7374 11.7933 39.1908 11.34C39.6574 10.8733 40.2041 10.5133 40.8308 10.26C41.4708 9.99333 42.1574 9.86 42.8908 9.86ZM56.1505 12.8C55.8838 12.7467 55.6171 12.72 55.3505 12.72C55.0038 12.72 54.6771 12.7667 54.3705 12.86C54.0638 12.9533 53.7971 13.1067 53.5705 13.32C53.3438 13.5333 53.1571 13.82 53.0105 14.18C52.8771 14.5267 52.8105 14.9667 52.8105 15.5V20H50.1505V10.16H52.7305V11.62C52.8771 11.3 53.0638 11.04 53.2905 10.84C53.5305 10.6267 53.7771 10.4667 54.0305 10.36C54.2971 10.2533 54.5571 10.18 54.8105 10.14C55.0771 10.1 55.3171 10.08 55.5305 10.08C55.6371 10.08 55.7371 10.0867 55.8305 10.1C55.9371 10.1 56.0438 10.1067 56.1505 10.12V12.8ZM58.0216 20V10.16H60.5616V11.36C60.6949 11.12 60.8682 10.9067 61.0816 10.72C61.2949 10.5333 61.5282 10.38 61.7816 10.26C62.0482 10.14 62.3216 10.0467 62.6016 9.98C62.8949 9.91333 63.1749 9.88 63.4416 9.88C64.1216 9.88 64.7149 10.02 65.2216 10.3C65.7282 10.58 66.1082 10.9867 66.3616 11.52C66.7482 10.92 67.2016 10.5 67.7216 10.26C68.2416 10.0067 68.8282 9.88 69.4816 9.88C69.9349 9.88 70.3749 9.95333 70.8016 10.1C71.2282 10.2333 71.6082 10.4533 71.9416 10.76C72.2749 11.0667 72.5416 11.46 72.7416 11.94C72.9416 12.4067 73.0416 12.9667 73.0416 13.62V20H70.4616V14.16C70.4616 13.6267 70.3216 13.1867 70.0416 12.84C69.7749 12.48 69.3349 12.3 68.7216 12.3C68.1482 12.3 67.7016 12.4933 67.3816 12.88C67.0616 13.2533 66.9016 13.7067 66.9016 14.24V20H64.2616V14.16C64.2616 13.6267 64.1216 13.1867 63.8416 12.84C63.5616 12.48 63.1216 12.3 62.5216 12.3C61.9349 12.3 61.4816 12.4867 61.1616 12.86C60.8416 13.2333 60.6816 13.6933 60.6816 14.24V20H58.0216Z"
      fill="var(--fg-primary)"
    />
    <path
      d="M79 10.5C79 7.18629 81.6863 4.5 85 4.5H92C95.3137 4.5 98 7.18629 98 10.5V14.5C98 17.8137 95.3137 20.5 92 20.5H81C79.8954 20.5 79 19.6046 79 18.5V10.5Z"
      fill="var(--bg-fill-brand)"
    />
    <path
      d="M90.6973 17.2275H88.4307L87.8555 15.3945H84.8408L84.2666 17.2275H82L84.9443 8.5H87.7529L90.6973 17.2275ZM93.627 17.2275H91.5176V8.5H93.627V17.2275ZM85.3428 13.793H87.3525L86.3809 10.6992H86.3125L85.3428 13.793Z"
      fill="var(--fg-inverse)"
    />
  </svg>
);

interface AttributionModalProps {
  open: boolean;
  onClose: () => void;
  aiHref: string;
  templatesHref: string;
  anchorRef: RefObject<HTMLElement | null>;
}

interface RemoveBrandingModalProps {
  open: boolean;
  onClose: () => void;
  upgradeHref: string;
  anchorRef: RefObject<HTMLElement | null>;
}

const RemoveBrandingModal: FC<RemoveBrandingModalProps> = ({ open, onClose, upgradeHref, anchorRef }) => {
  const [target, setTarget] = useState<{ container: HTMLElement; mode: PreviewMode } | null>(null);

  useEffect(() => {
    if (!open) {
      setTarget(null);
      return;
    }
    setTarget(findPreviewContainer(anchorRef.current));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, anchorRef]);

  if (!open || !target) return null;

  const isSheet = target.mode === 'phone' || target.mode === 'tablet';
  const overlayClass = `attribution-modal-overlay${isSheet ? ' attribution-modal-overlay--sheet' : ''}`;
  const modalClass = `attribution-modal attribution-modal--remove${isSheet ? ' attribution-modal--sheet' : ''}`;

  return createPortal(
    <div className={overlayClass} onClick={onClose} role="dialog" aria-modal="true">
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <h2 className="attribution-modal__title">
          Remove branding?
        </h2>
        <p className="attribution-modal__subtitle">
          The Jotform badge keeps this app on our free plan. Upgrade your plan to remove it.
        </p>
        <div className="attribution-modal__actions">
          <Button
            variant="Default"
            size="Small"
            fullWidth
            leftIcon="none"
            rightIcon="none"
            label="Upgrade your account"
            onClick={() => openExternal(upgradeHref)}
          />
          <Button
            variant="Outlined"
            size="Small"
            fullWidth
            leftIcon="none"
            rightIcon="none"
            label="No, thanks"
            onClick={onClose}
          />
        </div>
        <p className="attribution-modal__owner-note">
          Only the app owner sees this.
        </p>
      </div>
    </div>,
    target.container,
  );
};

const AttributionModal: FC<AttributionModalProps> = ({ open, onClose, aiHref, templatesHref, anchorRef }) => {
  const [target, setTarget] = useState<{ container: HTMLElement; mode: PreviewMode } | null>(null);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!open) {
      setTarget(null);
      setPrompt('');
      return;
    }
    setTarget(findPreviewContainer(anchorRef.current));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, anchorRef]);

  if (!open || !target) return null;

  const isSheet = target.mode === 'phone' || target.mode === 'tablet';
  const overlayClass = `attribution-modal-overlay${isSheet ? ' attribution-modal-overlay--sheet' : ''}`;
  const modalClass = `attribution-modal${isSheet ? ' attribution-modal--sheet' : ''}`;

  const handleGenerate = () => {
    openExternal(aiHref);
  };

  return createPortal(
    <div className={overlayClass} onClick={onClose} role="dialog" aria-modal="true">
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="attribution-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="X" size={20} />
        </button>
        <div className="attribution-modal__brand">
          <JotformAiLogo />
        </div>
        <h2 className="attribution-modal__title">
          Make your own app <span className="attribution-modal__title-accent">with AI</span>
        </h2>
        <p className="attribution-modal__subtitle">
          Turn ideas into apps in minutes — no coding needed.
        </p>
        <textarea
          className="attribution-modal__prompt"
          placeholder="e.g. A booking app for my yoga studio with calendar and payments…"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="attribution-modal__suggestions">
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="attribution-modal__chip"
              onClick={() => setPrompt(s.prompt)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="attribution-modal__actions">
          <Button
            variant="Default"
            size="Small"
            fullWidth
            leftIcon="Sparkles"
            rightIcon="none"
            label="Generate with AI"
            onClick={handleGenerate}
          />
          <Button
            variant="Outlined"
            size="Small"
            fullWidth
            leftIcon="none"
            rightIcon="none"
            label="See Templates"
            onClick={() => openExternal(templatesHref)}
          />
        </div>
      </div>
    </div>,
    target.container,
  );
};

export const AttributionBar: FC<AttributionBarProps> = ({
  aiHref = 'https://www.jotform.com/ai/app-generator/?utm_source=app-builder&utm_medium=attribution&utm_campaign=ai-prompt',
  templatesHref = 'https://www.jotform.com/app-templates/?utm_source=app-builder&utm_medium=attribution&utm_campaign=templates',
  upgradeHref = 'https://www.jotform.com/pricing/?utm_source=app-builder&utm_medium=attribution&utm_campaign=remove-branding',
  openAiSheetOnMount = false,
}) => {
  const [open, setOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openAiSheetOnMount) setOpen(true);
  }, [openAiSheetOnMount]);

  return (
    <>
      <div className="attribution-banner-wrap" ref={wrapperRef}>
        <button
          type="button"
          className="attribution-banner"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="attribution-banner__brand">
            <JotformBrandLogo className="attribution-banner__logo" />
            <span className="attribution-banner__divider" aria-hidden="true" />
            <span className="attribution-banner__category">Apps</span>
          </span>
          <span className="attribution-banner__action">
            <span className="attribution-banner__tagline">Create your own Jotform App - It&rsquo;s free</span>
            <span className="attribution-banner__cta">Create your own App</span>
          </span>
        </button>
        <button
          type="button"
          className="attribution-banner__remove"
          onClick={(e) => {
            e.stopPropagation();
            setRemoveOpen(true);
          }}
          aria-label="Remove Jotform branding"
        >
          <Icon name="X" size={12} />
          <span className="attribution-banner__remove-label">Remove Branding</span>
        </button>
      </div>
      <AttributionModal
        open={open}
        onClose={() => setOpen(false)}
        aiHref={aiHref}
        templatesHref={templatesHref}
        anchorRef={wrapperRef}
      />
      <RemoveBrandingModal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        upgradeHref={upgradeHref}
        anchorRef={wrapperRef}
      />
    </>
  );
};
