import { useEffect, useState } from "react";
import { PlayerProvider, usePlayer } from "./store/player";
import { MobileNav, Sidebar } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Toasts from "./components/Toasts";
import SoundWaveLoader from "./components/SoundWaveLoader";
import FullScreenPlayer from "./components/FullScreenPlayer";
import ProfileModal from "./components/ProfileModal";
import InstallButton from "./components/InstallApp";
import { AddToPlaylistModal } from "./components/PlaylistModals";
import { WifiOffIcon } from "./components/icons";
import HomeView from "./views/HomeView";
import LikedView from "./views/LikedView";
import AccountView from "./views/AccountView";
import PlusView from "./views/PlusView";
import PlaylistsView from "./views/PlaylistsView";
import { LogoMark } from "./components/icons";

function Shell() {
  const {
    section,
    setSection,
    search,
    setSearch,
    queue,
    current,
    coverFor,
    isPlaying,
    toggle,
    next,
    prev,
    seek,
    toggleMute,
    time,
    duration,
    isShuffle,
    toggleShuffle,
    cloudStatus,
    pushToast,
  } = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);
  const [fullScreenPlayerOpen, setFullScreenPlayerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 380);
    return () => clearTimeout(timer);
  }, []);

  /* PWA: connection feedback */
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  useEffect(() => {
    const onOffline = () => {
      setIsOffline(true);
      pushToast("You're offline — cached tracks will still play", "default");
    };
    const onOnline = () => {
      setIsOffline(false);
      pushToast("Back online", "success");
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [pushToast]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (e.key === "Escape") {
        setQueueOpen(false);
        return;
      }
      if (typing) return;
      switch (e.key.toLowerCase()) {
        case " ":
          if (el?.tagName === "BUTTON" || el?.tagName === "A") return;
          e.preventDefault();
          toggle();
          break;
        case "arrowright":
          seek(time + 5);
          break;
        case "arrowleft":
          seek(time - 5);
          break;
        case "m":
          toggleMute();
          break;
        case "n":
          next();
          break;
        case "p":
          prev();
          break;
        case "s":
          toggleShuffle();
          break;
        case "/":
          e.preventDefault();
          document.getElementById("global-search")?.focus();
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [duration, next, prev, seek, time, toggle, toggleMute, toggleShuffle]);

  const navigate = (id: string) => {
    setSection(id);
    document.getElementById("scroll-area")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          section={section}
          onNavigate={navigate}
          onOpenQueue={() => setQueueOpen(true)}
          queueCount={queue.length}
          current={current}
          coverUrl={current ? coverFor(current) : undefined}
          playing={isPlaying}
          cloudStatus={cloudStatus}
        />

        <main id="scroll-area" className="scrollbar-thin relative min-w-0 flex-1 overflow-y-auto">
          <TopBar
            search={search}
            onSearch={setSearch}
            onOpenQueue={() => setQueueOpen((v) => !v)}
            queueCount={queue.length}
            shuffle={isShuffle}
            onShuffle={toggleShuffle}
            onNavigate={navigate}
          />
          <div className="animate-fade-up" key={section}>
            {section === "home" && <HomeView />}
            {section === "liked" && <LikedView />}
            {section === "plus" && <PlusView />}
            {section === "playlists" && <PlaylistsView />}
            {section === "account" && <AccountView />}
          </div>

          <footer className="mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 py-6 text-[11.5px] text-white/40 sm:mx-6">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-[13px] font-extrabold text-white">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-[#b83b00] text-[#1b0d00]">
                  <LogoMark width={14} height={14} />
                </span>
                Vibro<span className="text-brand">X</span>
              </span>
              <span className="text-white/25">·</span>
              <span>Made by KavishJ.</span>
            </div>
            <InstallButton className="h-9 md:hidden" />
          </footer>
        </main>

        <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      </div>

      <PlayerBar onOpenFullScreen={() => setFullScreenPlayerOpen(true)} />
      <MobileNav
        section={section}
        onNavigate={navigate}
        onOpenQueue={() => setQueueOpen((v) => !v)}
        queueCount={queue.length}
      />
      <FullScreenPlayer
        open={fullScreenPlayerOpen}
        onClose={() => setFullScreenPlayerOpen(false)}
        onOpenQueue={() => setQueueOpen(true)}
      />
      <SoundWaveLoader
        visible={showSplash}
        message="Tuning Sound Waves…"
        onDismiss={() => setShowSplash(false)}
      />
      {isOffline && (
        <span className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+172px)] z-40 flex items-center gap-1.5 rounded-full border border-line bg-panel/95 px-3 py-1.5 text-[11px] font-bold text-white/70 shadow-lg backdrop-blur md:right-5 md:bottom-24">
          <WifiOffIcon width={13} height={13} className="text-brand" /> Offline mode
        </span>
      )}
      <ProfileModal />
      <AddToPlaylistModal />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <Shell />
    </PlayerProvider>
  );
}
