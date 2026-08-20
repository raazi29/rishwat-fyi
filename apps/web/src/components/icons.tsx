/**
 * Authored icon set. 24px box, 1.5px stroke, round caps and joins — drawn in
 * the product's own vocabulary (counters, documents, rupees, queues, seals)
 * rather than imported from a general-purpose library. See DESIGN.md §Shapes.
 *
 * Every icon is decorative by default (`aria-hidden`), because in this system
 * an icon always sits beside its own label.
 */

import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Pixel size of the square box. Default 20. */
  size?: number;
  /** Give the icon a name only when it carries meaning on its own. */
  title?: string;
}

function Icon({ size = 20, title, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4 4" />
  </Icon>
);

export const RupeeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 4h10M7 8.5h10M15.5 4c0 3.6-2.4 5.5-6 5.5H7l7 10.5" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const DocumentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5h7l5 5v12H6z" />
    <path d="M13 3.5v5h5M9 13h6M9 16.5h4" />
  </Icon>
);

/** A queue at a counter: the friction the product measures. */
export const VisitsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 20.5v-1.2A3.3 3.3 0 0 1 6.3 16h1.4a3.3 3.3 0 0 1 3.3 3.3v1.2" />
    <circle cx="7" cy="9.5" r="2.8" />
    <path d="M14 20.5v-1.2a3.3 3.3 0 0 1 2.3-3.14M17 12.2a2.8 2.8 0 0 0 0-5.4" />
    <path d="M21 20.5v-1.2a3.3 3.3 0 0 0-2.4-3.17" />
  </Icon>
);

export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 5.5 6v5.5c0 4.2 2.7 7.4 6.5 9 3.8-1.6 6.5-4.8 6.5-9V6z" />
  </Icon>
);

export const ShieldCheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 5.5 6v5.5c0 4.2 2.7 7.4 6.5 9 3.8-1.6 6.5-4.8 6.5-9V6z" />
    <path d="m9.2 11.8 2 2 3.6-3.9" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.3v2.4" />
  </Icon>
);

export const EyeOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 12S6.9 6.5 12 6.5c1.2 0 2.3.3 3.3.8M20.5 12s-3.4 5.5-8.5 5.5c-1.2 0-2.3-.3-3.2-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M4 4l16 16" />
  </Icon>
);

export const ScaleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4.5v15M7 19.5h10M6 8h12M12 4.5 6 8l-2.5 5a3 3 0 0 0 5 0L6 8M12 4.5 18 8l2.5 5a3 3 0 0 1-5 0L18 8" />
  </Icon>
);

export const DatabaseIcon = (props: IconProps) => (
  <Icon {...props}>
    <ellipse cx="12" cy="6.5" rx="6.5" ry="2.8" />
    <path d="M5.5 6.5v11c0 1.55 2.9 2.8 6.5 2.8s6.5-1.25 6.5-2.8v-11M5.5 12c0 1.55 2.9 2.8 6.5 2.8s6.5-1.25 6.5-2.8" />
  </Icon>
);

export const MapPinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21c3.5-4.2 5.5-7 5.5-9.8A5.5 5.5 0 0 0 6.5 11.2C6.5 14 8.5 16.8 12 21Z" />
    <circle cx="12" cy="11" r="2.2" />
  </Icon>
);

export const BuildingIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 20.5h17M4.5 20.5V10l7.5-5 7.5 5v10.5" />
    <path d="M9.5 20.5v-5.5h5v5.5M8 10.5h8" />
  </Icon>
);

export const ChartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20.5h16M7.5 20.5V13M12 20.5V7.5M16.5 20.5v-5" />
  </Icon>
);

export const UsersIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9.5" cy="8.5" r="3.2" />
    <path d="M3.5 20.5v-1.3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1.3" />
    <path d="M16.5 5.8a3.2 3.2 0 0 1 0 5.4M18 15.6a4 4 0 0 1 2.5 3.6v1.3" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const CheckCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.2 12.3 2.6 2.6 5-5.4" />
  </Icon>
);

export const InfoIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8h.01" />
  </Icon>
);

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 16.8h.01" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const FilterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </Icon>
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v10.5M8 11l4 4 4-4M4.5 19.5h15" />
  </Icon>
);

export const ShareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 15.5V4M8 8l4-4 4 4" />
    <path d="M5 13v5.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V13" />
  </Icon>
);

export const BookmarkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6.5 4h11v16.5L12 16.5l-5.5 4z" />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="6" width="16" height="14.5" rx="2" />
    <path d="M4 10.5h16M8.5 4v4M15.5 4v4" />
  </Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Icon>
);

export const ExternalIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4.5h5.5V10M19 5l-7.5 7.5" />
    <path d="M18 14v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5" />
  </Icon>
);

export const CodeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.5 5.5l-3 13" />
  </Icon>
);

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4.5V10h-5.5" />
  </Icon>
);

export const HelpIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.4A2.5 2.5 0 0 1 14.5 10c0 1.7-2.5 2-2.5 3.6M12 16.8h.01" />
  </Icon>
);

export const StampIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 20.5h12M5 17h14v-2.5a2 2 0 0 0-2-2h-1.6l.5-4.3A2.9 2.9 0 0 0 13 4.9h-2a2.9 2.9 0 0 0-2.9 3.3l.5 4.3H7a2 2 0 0 0-2 2z" />
  </Icon>
);

export const CompassIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.2 14.8 1.6-4 4-1.6-1.6 4z" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
