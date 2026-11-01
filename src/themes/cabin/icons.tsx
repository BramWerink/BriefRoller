/* Icons for the Cabin theme, drawn to the Figma design's sizes. Colour comes from `currentColor`. */

export function LockOpenIcon() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" focusable="false">
      <rect x="0" y="6" width="14" height="10" rx="2" fill="currentColor" />
      <path
        d="M9.5 7V4.85a3.65 3.65 0 0 1 7.3 0V7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockClosedIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" focusable="false">
      <rect x="0" y="6" width="14" height="10" rx="2" fill="currentColor" />
      <path
        d="M2.95 7V5.25a4.05 4.05 0 0 1 8.1 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}

/** A die showing five, cut out of a rounded square so the pips show the button colour. */
export function DieIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M4 0h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z
           M8 5.9a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z
           M20 5.9a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z
           M14 11.9a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z
           M8 17.9a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z
           M20 17.9a2.1 2.1 0 1 0 0 4.2a2.1 2.1 0 1 0 0-4.2Z"
      />
    </svg>
  );
}

export function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 5.5V10l3 2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function ListsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <circle cx="3" cy="4.5" r="1.6" />
        <circle cx="3" cy="10" r="1.6" />
        <circle cx="3" cy="15.5" r="1.6" />
        <rect x="7" y="3.5" width="12" height="2" rx="1" />
        <rect x="7" y="9" width="12" height="2" rx="1" />
        <rect x="7" y="14.5" width="12" height="2" rx="1" />
      </g>
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <path d="M6 2h8v2h-1v5l3 3v2H4v-2l3-3V4H6V2Z" />
        <rect x="9" y="13" width="2" height="6" rx="1" />
      </g>
    </svg>
  );
}
