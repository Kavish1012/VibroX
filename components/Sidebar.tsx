import type { ReactNode } from "react";
import type { Track } from "../types";
import { cn } from "../utils/cn";
import CoverArt from "./CoverArt";
import Visualizer from "./Visualizer";
import { HeartIcon, HomeIcon, LogoMark, PlaylistIcon, QueueIcon, SparkIcon } from "./icons";
import InstallButton from "./InstallApp";
import { usePlayer } from "../store/player";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export const NAV: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "liked", label: "Liked", icon: <HeartIcon /> },
  { id: "playlists", label: "Playlists", icon: <PlaylistIcon /> },
];

interface Props {
  section: string;
  onNavigate: (id: string) => void;
  onOpenQueue: () => void;
  queueCount: number;
  current: Track | null;
  coverUrl?: string;
  playing?: boolean;
  cloudStatus?: string;
}

export function Sidebar({
  section,
  onNavigate,
  onOpenQueue,
  queueCount,
  current,
  coverUrl,
  playing,
  cloudStatus,
}: Props) {
  const { pushToast } = usePlayer();

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col gap-6 border-r border-line/70 bg-gradient-to-b from-[#151515] to-[#0b0b0b] px-4 py-6 md:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-brand to-[#b83b00] text-[#1b0d00] shadow-[0_10px_28px_rgba(255,122,0,.28)]">
          <LogoMark />
        </span>
        <p className="text-[22px] font-extrabold tracking-tight">
          Vibro<span className="text-brand">X</span>
        </p>
      </div>

      <nav className="grid gap-1.5">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-[14px] font-semibold transition",
              section === item.id
                ? "bg-elev text-white before:absolute before:top-1/5 before:bottom-1/5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <span className={cn(section === item.id && "text-brand")}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          onClick={onOpenQueue}
          className={cn(
            "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-[14px] font-semibold transition",
            "text-white/50 hover:bg-white/[0.06] hover:text-white",
          )}
        >
          <span className="text-white/70">
            <QueueIcon />
          </span>
          Queue
          {queueCount > 0 && (
            <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-[#1b0d00]">
              {queueCount}
            </span>
          )}
        </button>
      </nav>

      <div className="mt-auto grid gap-3.5">
        <button
          onClick={() => {
            pushToast("VibroX Plus coming soon !!", "default");
            onNavigate("plus");
          }}
          className={cn(
            "group flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition",
            section === "plus"
              ? "border-brand bg-brand/25"
              : "border-brand/35 bg-gradient-to-r from-brand/15 via-[#ff922e]/10 to-transparent hover:border-brand/60 hover:bg-brand/20",
          )}
        >
          <div>
            <span className="flex items-center gap-1.5 text-[12px] font-black text-brand">
              <SparkIcon width={14} height={14} /> Get Plus
            </span>
            <span className="mt-0.5 block text-[10.5px] text-white/45">
              Lossless audio &amp; custom themes
            </span>
          </div>
          <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[9.5px] font-bold text-brand group-hover:bg-brand group-hover:text-[#1b0d00] transition">
            PRO
          </span>
        </button>

        {cloudStatus && (
          <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-white/40">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                cloudStatus === "ready"
                  ? "bg-emerald-400"
                  : cloudStatus === "offline"
                    ? "bg-danger"
                    : "animate-pulse bg-white/40",
              )}
            />
            {cloudStatus === "ready"
              ? "Shared library connected"
              : cloudStatus === "offline"
                ? "Shared library offline"
                : "Connecting to library…"}
          </div>
        )}
        {current && (
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-3 rounded-2xl border border-line/70 bg-panel p-2.5 text-left transition hover:border-brand/40"
          >
            <CoverArt track={current} url={coverUrl} className="h-11 w-11 shrink-0" rounded="rounded-lg" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-bold">{current.title}</span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <Visualizer active={playing} className="h-2.5" />
                <span className="truncate text-[10.5px] text-white/45">{current.artist}</span>
              </span>
            </span>
          </button>
        )}
        <InstallButton className="w-full justify-center px-0" />
      </div>
    </aside>
  );
}

export function MobileNav({
  section,
  onNavigate,
  onOpenQueue,
  queueCount,
}: Pick<Props, "section" | "onNavigate" | "onOpenQueue" | "queueCount">) {
  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-line bg-[#0d0d0df2] px-1 py-1.5 backdrop-blur-xl md:hidden">
      {[...NAV, { id: "queue", label: "Queue", icon: <QueueIcon /> }].map((item) => (
        <button
          key={item.id}
          onClick={() => (item.id === "queue" ? onOpenQueue() : onNavigate(item.id))}
          className={cn(
            "relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition",
            section === item.id ? "text-brand" : "text-white/45",
          )}
        >
          {item.icon}
          {item.label}
          {item.id === "queue" && queueCount > 0 && (
            <span className="absolute top-0.5 right-[26%] h-1.5 w-1.5 rounded-full bg-brand" />
          )}
        </button>
      ))}
    </nav>
  );
}
