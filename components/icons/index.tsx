import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cherrymate custom icon set — hand-drawn on a 24px grid, rounded strokes.
 * `active` switches on a soft duotone fill (used for selected tabs/buttons).
 * Same API shape as lucide: className / strokeWidth / any SVG prop.
 */
export type IconProps = React.SVGProps<SVGSVGElement> & { active?: boolean; solid?: boolean };

function Icon({ active, solid, className, strokeWidth = 1.9, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-active={active ? "" : undefined}
      className={cn("size-6 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Duotone fill: invisible normally, soft tint when active. */
const tint = (active?: boolean, solid?: boolean) => ({ fill: "currentColor", fillOpacity: solid ? 1 : active ? 0.22 : 0 });

/* ------------------------------ Tabs ------------------------------ */

/** Discover — a radar sweep */
export const RadarIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6" {...tint(p.active, p.solid)} stroke="none" />
    <path d="M12 6a6 6 0 1 1-6 6" />
    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" />
    <path d="M2.5 12A9.5 9.5 0 0 0 12 21.5" />
    <path d="m12 12 4.6-4.6" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
  </Icon>
);

/** Map — a blobby pin with a heart */
export const PinBlobIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21.5s-7-5.6-7-11.2A7 7 0 0 1 19 10.3c0 5.6-7 11.2-7 11.2Z" {...tint(p.active, p.solid)} />
    <path d="M12 12.7s-2.6-1.6-2.6-3.3a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1.7-2.6 3.3-2.6 3.3Z" fill="currentColor" stroke="none" />
  </Icon>
);

/** Matches — a friendly wave 👋 */
export const WaveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M7.6 13.8V6.6a1.5 1.5 0 0 1 3 0V11m0-1.2V4.9a1.5 1.5 0 0 1 3 0v5.6m0-.4V6.4a1.5 1.5 0 0 1 3 0V13m0-1a1.5 1.5 0 0 1 3 0v3.2a6.8 6.8 0 0 1-6.8 6.8h-.6a6.8 6.8 0 0 1-5.3-2.5l-2.6-3.3a1.6 1.6 0 0 1 2.4-2.1l1.9 1.8"
      {...tint(p.active, p.solid)}
    />
    <path d="M3.4 7.6 2 6.6M4.7 4.6 4 3" />
  </Icon>
);

/** Chat — a squishy bubble with dots */
export const ChatBlobIcon = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M12 3.5c5 0 8.5 3.2 8.5 7.4s-3.5 7.4-8.5 7.4c-1 0-2-.1-2.9-.4L5 19.8l1-3.4c-1.5-1.4-2.5-3.3-2.5-5.5C3.5 6.7 7 3.5 12 3.5Z"
      {...tint(p.active, p.solid)}
    />
    <circle cx="8.4" cy="11" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="12" cy="11" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="15.6" cy="11" r="1.05" fill="currentColor" stroke="none" />
  </Icon>
);

/** Profile — a little smiley you */
export const MeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="4.2" {...tint(p.active, p.solid)} />
    <path d="M10.4 9.5c.9.8 2.3.8 3.2 0" />
    <path d="M4.5 20.5c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Icon>
);

/* ----------------------------- Actions ----------------------------- */

export const HeartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20.5S3.5 15.4 3.5 9.3A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.7c0 6.1-8.5 11.2-8.5 11.2Z" {...tint(p.active, p.solid)} />
    <path d="M7 8.7a2.2 2.2 0 0 1 1.7-1.4" />
  </Icon>
);

/** Pass — a soft "nah" cross */
export const NopeIcon = (p: IconProps) => (
  <Icon strokeWidth={2.6} {...p}>
    <path d="m6.8 6.8 10.4 10.4M17.2 6.8 6.8 17.2" />
  </Icon>
);

export const UndoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 14.5 4.5 10 9 5.5" />
    <path d="M4.5 10H14a5.25 5.25 0 0 1 0 10.5h-3" />
  </Icon>
);

export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h8.5M19 7h1M4 17h1.5M11 17h9" />
    <circle cx="15.8" cy="7" r="2.6" {...tint(p.active, p.solid)} />
    <circle cx="8.2" cy="17" r="2.6" {...tint(p.active, p.solid)} />
  </Icon>
);

export const LocateIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6.8" {...tint(p.active, p.solid)} />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6" />
  </Icon>
);

/** Ghost mode 👻 */
export const GhostIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 20.2V11a6.5 6.5 0 0 1 13 0v9.2l-2.2-1.6-2.1 1.6-2.2-1.6-2.2 1.6-2.1-1.6Z" {...tint(p.active, p.solid)} />
    <circle cx="9.8" cy="11.2" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="11.2" r="1.05" fill="currentColor" stroke="none" />
  </Icon>
);

/** Visible / broadcasting ((•)) */
export const SignalIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    <path d="M8.7 8.7a4.7 4.7 0 0 0 0 6.6M15.3 8.7a4.7 4.7 0 0 1 0 6.6" />
    <path d="M5.8 5.8a8.8 8.8 0 0 0 0 12.4M18.2 5.8a8.8 8.8 0 0 1 0 12.4" />
  </Icon>
);

export const SparkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M11 4c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" fill="currentColor" fillOpacity={0.9} />
    <path d="M19 2.5v3M17.5 4h3" />
  </Icon>
);

/** Flat — a house with a heart window */
export const HouseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" {...tint(p.active, p.solid)} />
    <path d="M12 16.8s-2.4-1.4-2.4-3a1.3 1.3 0 0 1 2.4-.7 1.3 1.3 0 0 1 2.4.7c0 1.6-2.4 3-2.4 3Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 11.8 20 4l-4.6 16-3.7-6.6Z" {...tint(p.active, p.solid)} />
    <path d="M11.7 13.4 20 4" />
  </Icon>
);

export const PhotoIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="3.5" {...tint(p.active, p.solid)} />
    <path d="m4.2 16.6 4.3-4.3 3.4 3.4 2.4-2.4 5 5" />
    <circle cx="15.6" cy="9.4" r="1.5" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" {...tint(p.active, p.solid)} />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);

export const GearIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6.4" {...tint(p.active, p.solid)} />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M5.2 18.8l1.5-1.5M17.3 6.7l1.5-1.5" />
  </Icon>
);

export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" {...tint(p.active, p.solid)} />
    <path d="M10 21h4" />
  </Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Icon>
);

export const DotsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
  </Icon>
);

/** The Cherrymate mark — two cherries orbiting a radar, for the radar core / logo spots */
export const CherryOrbitIcon = (p: IconProps) => (
  <Icon strokeWidth={1.7} {...p}>
    <path d="M9 15.2c.4-3.6 2-6.6 5.2-8.9M15.3 15.4c-.2-3.3-.5-6.4-1.1-9.1" />
    <path d="M14.2 6.3c1.4-1.5 3.6-1.8 5-.8-1.3 1.6-3.4 2-5 .8Z" fill="currentColor" stroke="none" />
    <circle cx="8.6" cy="16.6" r="3" fill="currentColor" stroke="none" />
    <circle cx="15.6" cy="16.8" r="3" fill="currentColor" stroke="none" />
  </Icon>
);
