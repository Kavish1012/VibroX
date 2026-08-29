import { useState } from "react";
import { usePlayer } from "../store/player";
import { SparkIcon } from "../components/icons";
import { cn } from "../utils/cn";

const FEATURES = [
  {
    name: "Audio Quality",
    free: "Standard 256 kbps MP3",
    plus: "Lossless 24-bit / 192 kHz FLAC & Hi-Res Studio Audio",
  },
  {
    name: "Sound Equalizer",
    free: "Standard Browser DSP",
    plus: "10-Band Pro Parametric Equalizer + Bass Boost & Spatial 3D",
  },
  {
    name: "Sound Wave Visualizers",
    free: "VibroX Classic Orange Wave",
    plus: "8 Dynamic Reactive Visualizer Themes (Cyberpunk, Prism, Vinyl Glow)",
  },
  {
    name: "Cross-Device Cloud Sync",
    free: "Liked Songs & Uploads",
    plus: "Instant Smart Cloud Playlists + Offline Cache Download",
  },
  {
    name: "Moderator Badge & Themes",
    free: "Standard Dark Ink",
    plus: "Custom OLED Black & Neon Accent Palettes",
  },
];

export default function PlusView() {
  const { pushToast, user } = usePlayer();
  const [email, setEmail] = useState(user?.email || "");
  const [joined, setJoined] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      pushToast("Enter a valid email address.", "error");
      return;
    }
    setJoined(true);
    pushToast("✨ You're on the VibroX Plus VIP Launch List!", "default");
  };

  return (
    <div className="px-4 pb-14 sm:px-6">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-[28px] border border-brand/35 bg-gradient-to-br from-[#291605] via-[#161616] to-[#0c0c0c] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 right-4 h-72 w-72 animate-pulse rounded-full bg-brand/25 blur-[95px]" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#ff922e]/15 blur-[90px]" />

        <div className="relative mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/15 px-4 py-1.5 text-[11.5px] font-extrabold tracking-[0.2em] text-brand uppercase shadow-[0_0_20px_rgba(255,122,0,0.35)]">
            <SparkIcon width={14} height={14} /> VibroX Plus · Coming Soon !!
          </span>

          <h1 className="mt-5 text-[clamp(32px,5.5vw,56px)] leading-[1.02] font-black tracking-tight text-white">
            Audiophile fidelity.{" "}
            <span className="bg-gradient-to-r from-brand via-[#ffab5e] to-white bg-clip-text text-transparent">
              Zero compromises.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-[560px] text-[14px] leading-relaxed text-white/65">
            Upgrade your browser listening room to 24-bit Hi-Res audio, studio parametric equalizers,
            reactive soundwave themes, and offline cloud downloads.
          </p>

          {/* Billing Switcher Preview */}
          <div className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-full px-4 py-1.5 text-[12px] font-extrabold transition",
                billingCycle === "monthly"
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white",
              )}
            >
              Monthly ($4.99)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-extrabold transition",
                billingCycle === "yearly"
                  ? "bg-brand text-[#1b0d00]"
                  : "text-white/50 hover:text-white",
              )}
            >
              <span>Yearly ($39.99)</span>
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-black text-white">
                SAVE 33%
              </span>
            </button>
          </div>

          {/* Waitlist form */}
          <div className="mx-auto mt-8 max-w-[460px]">
            {joined ? (
              <div className="rounded-2xl border border-brand/40 bg-brand/15 px-5 py-4 text-center">
                <p className="text-[14px] font-black text-brand">
                  🎉 You're on the early-access list!
                </p>
                <p className="mt-1 text-[12px] text-white/70">
                  We'll email <span className="font-semibold text-white">{email}</span> as soon as
                  VibroX Plus opens for VIP members.
                </p>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address…"
                  className="h-12 flex-1 rounded-full border border-line bg-black/60 px-5 text-[13.5px] text-white placeholder:text-white/35 focus:border-brand/70 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-[13px] font-extrabold text-[#1b0d00] shadow-[0_0_24px_rgba(255,122,0,0.45)] transition hover:scale-105 hover:bg-brand-soft active:scale-95"
                >
                  <SparkIcon width={15} height={15} />
                  <span>Notify Me on Launch</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Plan comparison grid */}
      <section className="mx-auto mt-10 max-w-[940px]">
        <div className="mb-6 text-center">
          <h2 className="text-[22px] font-extrabold tracking-tight text-white">
            Free vs. VibroX Plus
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            Every listener keeps full free access — Plus unlocks audiophile extras.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free Tier Card */}
          <div className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold tracking-widest text-white/45 uppercase">
                  Current Tier
                </span>
                <h3 className="mt-1 text-[21px] font-black text-white">VibroX Free</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-extrabold text-white/80">
                $0 / forever
              </span>
            </div>

            <ul className="mt-6 grid gap-3.5 border-t border-line/60 pt-5 text-[13px]">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <div>
                    <span className="font-bold text-white/70">{f.name}:</span>{" "}
                    <span className="text-white/45">{f.free}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Plus Tier Card */}
          <div className="relative overflow-hidden rounded-2xl border border-brand/50 bg-gradient-to-b from-[#211409] to-card p-6 shadow-[0_20px_60px_rgba(255,122,0,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest text-brand uppercase">
                  <SparkIcon width={13} height={13} /> Coming Soon !!
                </span>
                <h3 className="mt-1 text-[21px] font-black text-white">VibroX Plus</h3>
              </div>
              <span className="rounded-full bg-brand px-3 py-1 text-[12px] font-extrabold text-[#1b0d00]">
                {billingCycle === "yearly" ? "$3.33 / mo" : "$4.99 / mo"}
              </span>
            </div>

            <ul className="mt-6 grid gap-3.5 border-t border-brand/25 pt-5 text-[13px]">
              {FEATURES.map((f) => (
                <li key={f.name} className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgba(255,122,0,0.8)]" />
                  <div>
                    <span className="font-bold text-white">{f.name}:</span>{" "}
                    <span className="text-brand-soft font-semibold">{f.plus}</span>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => pushToast("VibroX Plus coming soon !! Check your launch alert.", "default")}
              className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-extrabold text-[#1b0d00] transition hover:bg-brand-soft active:scale-95"
            >
              <SparkIcon width={16} height={16} />
              <span>Get VibroX Plus — Coming Soon !!</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
