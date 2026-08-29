import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 20,
  height: 20,
  ...p,
});

export const HomeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const LibraryIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4v16M9 4v16" />
    <path d="m14 5 5.5 15" />
  </svg>
);

export const QueueIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h11M4 12h11M4 18h7" />
    <path d="M17 13.5a2.5 2.5 0 1 0 4 2v-6l-4 1.4" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.6c0-1 1.1-1.6 2-1.1l9 5.9a1.3 1.3 0 0 1 0 2.2l-9 5.9c-.9.5-2-.1-2-1.1V5.6Z" />
  </svg>
);

export const PauseIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="4.5" width="4" height="15" rx="1.4" />
    <rect x="13.5" y="4.5" width="4" height="15" rx="1.4" />
  </svg>
);

export const NextIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M6 6.2c0-.9 1-1.4 1.7-.9l7.6 5a1.1 1.1 0 0 1 0 1.9l-7.6 5c-.7.5-1.7 0-1.7-.9V6.2Z" />
    <rect x="16.4" y="4.6" width="2.4" height="14.8" rx="1.2" />
  </svg>
);

export const PrevIcon = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M18 6.2c0-.9-1-1.4-1.7-.9l-7.6 5a1.1 1.1 0 0 0 0 1.9l7.6 5c.7.5 1.7 0 1.7-.9V6.2Z" />
    <rect x="5.2" y="4.6" width="2.4" height="14.8" rx="1.2" />
  </svg>
);

export const ShuffleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M16 4h4v4M20 4l-6.5 6.5M8 20H4v-4M4 20l6-6" />
    <path d="M14.5 14.5 20 20v-4M20 20h-4" />
  </svg>
);

export const RepeatIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 3.5 20.5 7 17 10.5" />
    <path d="M20.5 7H8A4.5 4.5 0 0 0 3.5 11.5V13" />
    <path d="M7 20.5 3.5 17 7 13.5" />
    <path d="M3.5 17H16a4.5 4.5 0 0 0 4.5-4.5V11" />
  </svg>
);

export const RepeatOneIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 3.5 20.5 7 17 10.5" />
    <path d="M20.5 7H8A4.5 4.5 0 0 0 3.5 11.5V13" />
    <path d="M7 20.5 3.5 17 7 13.5" />
    <path d="M3.5 17H16a4.5 4.5 0 0 0 4.5-4.5V11" />
    <path d="M11.4 10.6 12.8 10v4.4" strokeWidth={1.7} />
  </svg>
);

export const VolumeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3L11.5 6v12L7 14.5H4z" />
    <path d="M15 9.5a3.4 3.4 0 0 1 0 5M17.6 7a7 7 0 0 1 0 10" />
  </svg>
);

export const MuteIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3L11.5 6v12L7 14.5H4z" />
    <path d="m15.5 10 4 4M19.5 10l-4 4" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.8 12.3a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
  </svg>
);

export const PencilIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M16.5 3.9a2 2 0 0 1 2.8 2.8L8 18l-4 1 1-4L16.5 3.9Z" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const MusicIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 18V6.8l10-2v10.4" />
    <circle cx="6.5" cy="18" r="2.6" />
    <circle cx="16.5" cy="15.2" r="2.6" />
  </svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.7 9l5.3 1.8-5.3 1.8L12 18l-1.7-5.4L5 10.8 10.3 9 12 3.5Z" />
    <path d="M18.5 16.5 19.2 18l1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 16V4.5M8 8l4-3.5L16 8" />
    <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
  </svg>
);

export const LogoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 5.5V4.8A1.8 1.8 0 0 0 12.2 3H6.5a1.8 1.8 0 0 0-1.8 1.8v14.4A1.8 1.8 0 0 0 6.5 21h5.7a1.8 1.8 0 0 0 1.8-1.8v-.7" />
    <path d="M10.5 12h9M16.5 8.8 19.8 12l-3.3 3.2" />
  </svg>
);

export const CloudIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.5 18h9.8a3.7 3.7 0 0 0 .5-7.4 5.3 5.3 0 0 0-10.3-1A3.9 3.9 0 0 0 7.5 18Z" />
    <path d="M12 15.5v-5M9.8 12.5 12 10.3l2.2 2.2" />
  </svg>
);

export const CloudOffIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.5 18h9.8a3.7 3.7 0 0 0 1.6-7l-8.4-3.3" />
    <path d="M7.5 18a3.9 3.9 0 0 1 .8-1.6" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5V16M8 12.5l4 3.5 4-3.5" />
    <path d="M4.5 19h15" />
  </svg>
);

export const WifiOffIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 9.5a12 12 0 0 1 7-2.5c.9 0 1.7.1 2.5.3" />
    <path d="M8.5 12.5a7 7 0 0 1 3.5-1c.9 0 1.7.2 2.5.6" />
    <path d="M12 16.5h.01" />
    <path d="m4 4 16 16" />
  </svg>
);

export const PlaylistIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h10M4 11h10M4 16h5.5" />
    <path d="M17.6 5.5v9.2" />
    <circle cx="15.9" cy="15.5" r="1.9" />
    <path d="M17.8 15.5v-4.2l2.4.9" />
  </svg>
);

export const ChevronLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-2.5Z" />
    <path d="m9.2 12.2 2 2 3.6-3.8" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const RefreshIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11.5A8 8 0 0 0 6.2 6.6L4 8.8" />
    <path d="M4 4.5v4.3h4.3" />
    <path d="M4 12.5a8 8 0 0 0 13.8 4.9L20 15.2" />
    <path d="M20 19.5v-4.3h-4.3" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2.2" />
    <path d="M15 5.8A1.8 1.8 0 0 0 13.2 4H6.8A1.8 1.8 0 0 0 5 5.8v6.4A1.8 1.8 0 0 0 6.8 14" />
  </svg>
);

export const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.5-1.76 4.4-5.5 4.4A6.5 6.5 0 1 1 16.3 7l2.8-2.7A10.2 10.2 0 1 0 12 22c5.9 0 9.8-4.1 9.8-9.9 0-.7-.07-1.2-.16-1.9H12Z"
    />
  </svg>
);

export const LogoMark = (p: P) => (
  <svg viewBox="0 0 32 32" fill="none" width={20} height={20} {...p}>
    <path
      d="M6 20.5c2.4 0 2.4-9 4.9-9s2.5 12 5 12 2.5-15 5-15 2.4 12 5.1 12"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);
