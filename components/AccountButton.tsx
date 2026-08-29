import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import { LogoutIcon, ShieldIcon, UserIcon } from "./icons";

/**
 * Account control pinned to the far right of the top bar.
 * Shows a sign-in prompt for guests and an avatar + menu for members.
 */
export default function AccountButton({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { user, isAdmin, section, signOutCloud, cloudStatus, tracks } = usePlayer();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cloudCount = tracks.filter((t) => t.remote).length;

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user ? user.email : "Sign in"}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full border pl-1 pr-1 transition sm:pr-3.5",
          user
            ? "border-line bg-panel hover:border-brand/50"
            : "border-brand/40 bg-brand/10 hover:bg-brand/20",
        )}
      >
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full text-[13px] font-black",
            user
              ? "bg-gradient-to-br from-brand to-[#b83b00] text-[#1b0d00]"
              : "bg-white/10 text-white/70",
          )}
        >
          {user ? (user.email?.[0] ?? "?").toUpperCase() : <UserIcon width={17} height={17} />}
        </span>
        <span className="hidden max-w-[110px] flex-col items-start leading-none lg:flex">
          <span className="max-w-[110px] truncate text-[12px] font-bold">
            {user ? (isAdmin ? "Moderator" : "Member") : "Sign in"}
          </span>
          <span className="mt-1 max-w-[110px] truncate text-[10px] text-white/45">
            {user ? user.email : "Account"}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute top-[calc(100%+10px)] right-0 z-50 w-[268px] overflow-hidden rounded-2xl border border-line bg-[#161616] shadow-[0_28px_70px_rgba(0,0,0,.75)]"
        >
          {user ? (
            <>
              <div className="flex items-center gap-3 border-b border-line/70 bg-black/25 px-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-[#b83b00] text-[15px] font-black text-[#1b0d00]">
                  {(user.email?.[0] ?? "?").toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{user.email}</span>
                  <span className="mt-1 flex items-center gap-1.5">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-brand uppercase">
                        <ShieldIcon width={10} height={10} /> moderator
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white/55 uppercase">
                        member
                      </span>
                    )}
                    <span className="text-[10px] text-white/35">{cloudCount} shared</span>
                  </span>
                </span>
              </div>

              <div className="p-1.5 grid gap-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    onNavigate("account");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <UserIcon width={16} height={16} /> Account &amp; {isAdmin ? "Admin Studio" : "Cloud Sync"}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    void signOutCloud();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-3 py-2.5 text-[12.5px] font-bold text-[#ffb4b4] transition hover:bg-danger/25 hover:text-white"
                >
                  <LogoutIcon width={16} height={16} /> Log out
                </button>
              </div>

              <p className="border-t border-line/70 bg-black/25 px-4 py-2.5 text-[10.5px] leading-relaxed text-white/35">
                {isAdmin
                  ? "You can publish, edit and remove shared tracks."
                  : "Publishing is restricted to moderators."}
              </p>
            </>
          ) : (
            <>
              <div className="border-b border-line/70 bg-black/25 px-4 py-4">
                <p className="text-[13.5px] font-bold">Join the shared library</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/50">
                  Sync your likes across devices. Publishing tracks is limited to moderator accounts.
                </p>
              </div>
              <div className="p-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    onNavigate("account");
                  }}
                  className={cn(
                    "h-10 w-full rounded-xl bg-brand text-[12.5px] font-bold text-[#1b0d00] transition hover:bg-brand-soft",
                    section === "account" && "opacity-70",
                  )}
                >
                  Sign in / Create account
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] text-white/35">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      cloudStatus === "ready"
                        ? "bg-emerald-400"
                        : cloudStatus === "offline"
                          ? "bg-danger"
                          : "animate-pulse bg-white/40",
                    )}
                  />
                  cloud {cloudStatus}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
