import { useState } from "react";
import {
  CloseIcon,
  LogoMark,
  PlusIcon,
  QueueIcon,
  SearchIcon,
  ShuffleIcon,
  SparkIcon,
} from "./icons";
import AccountButton from "./AccountButton";
import CreatePlaylistModal from "./PlaylistModals";
import InstallButton from "./InstallApp";
import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onOpenQueue: () => void;
  queueCount: number;
  shuffle: boolean;
  onShuffle: () => void;
  onNavigate: (id: string) => void;
}

export default function TopBar({
  search,
  onSearch,
  onOpenQueue,
  queueCount,
  shuffle,
  onShuffle,
  onNavigate,
}: Props) {
  const { pushToast, user, setSection } = usePlayer();
  const [createOpen, setCreateOpen] = useState(false);

  const handleAdd = () => {
    if (user) {
      setCreateOpen(true);
    } else {
      pushToast("Sign in to create playlists.", "error");
      setSection("account");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2.5 bg-gradient-to-b from-ink via-ink/85 to-transparent px-4 py-4 backdrop-blur-md sm:gap-3 sm:px-6">
      <span className="flex shrink-0 items-center md:hidden" aria-hidden>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-[#b83b00] text-[#1b0d00]">
          <LogoMark width={17} height={17} />
        </span>
      </span>

      <label className="relative flex-1 max-w-[560px]">
        <SearchIcon
          width={18}
          height={18}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/40"
        />
        <input
          id="global-search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          type="search"
          placeholder="Search songs, artists, albums…   ( / )"
          aria-label="Search your library"
          className="h-11 w-full rounded-full border border-line bg-elev/90 pr-10 pl-11 text-[13.5px] text-white placeholder:text-white/35 focus:border-brand/60 focus:bg-elev focus:outline-none"
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          >
            <CloseIcon width={13} height={13} />
          </button>
        )}
      </label>

      <button
        onClick={handleAdd}
        title="Create playlist"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[12px] font-extrabold text-[#1b0d00] transition hover:scale-105 hover:bg-brand-soft active:scale-95"
      >
        <PlusIcon width={14} height={14} />
        <span>Add</span>
      </button>

      <button
        onClick={() => {
          pushToast("VibroX Plus coming soon !!", "default");
          onNavigate("plus");
        }}
        className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand/40 bg-gradient-to-r from-brand/20 via-[#ff922e]/20 to-brand/10 px-3.5 text-[12px] font-extrabold text-brand transition hover:border-brand hover:bg-brand/25 hover:scale-105 active:scale-95 sm:flex"
      >
        <SparkIcon width={14} height={14} />
        <span>Get Plus</span>
      </button>

      <button
        onClick={onShuffle}
        aria-label="Toggle shuffle"
        title="Shuffle"
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-panel text-white/60 transition hover:border-white/20 hover:text-white",
          shuffle && "border-brand/50 bg-brand/15 text-brand",
        )}
      >
        <ShuffleIcon width={17} height={17} />
      </button>

      <button
        onClick={onOpenQueue}
        aria-label="Open queue"
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-panel text-white/60 transition hover:border-white/20 hover:text-white"
      >
        <QueueIcon width={18} height={18} />
        {queueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-[#1b0d00]">
            {queueCount}
          </span>
        )}
      </button>

      <InstallButton compact className="h-11 px-3 sm:px-3.5" />

      <AccountButton onNavigate={onNavigate} />

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => onNavigate("playlists")}
      />
    </header>
  );
}
