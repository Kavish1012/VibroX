import { useEffect, useState } from "react";
import { usePlayer } from "../store/player";
import { UserIcon } from "./icons";

/**
 * Shown once per fresh login when the user's profile (name + date of birth)
 * isn't complete. Data is persisted to Supabase Auth user metadata.
 */
export default function ProfileModal() {
  const { profilePrompt, user, profile, saveProfile, skipProfilePrompt } = usePlayer();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profilePrompt) {
      setName(profile.name);
      setDob(profile.dob);
      setError("");
      setBusy(false);
    }
  }, [profilePrompt, profile]);

  if (!profilePrompt || !user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your full name.");
      return;
    }
    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }
    if (dob > today) {
      setError("Date of birth can't be in the future.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile(trimmed, dob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="animate-fade-up w-full max-w-[400px] rounded-2xl border border-line bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,.75)]"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-[#b83b00] text-[#1b0d00]">
            <UserIcon width={22} height={22} />
          </span>
          <div>
            <h3 className="text-[18px] font-extrabold tracking-tight">
              Welcome{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}!
            </h3>
            <p className="mt-0.5 text-[11.5px] text-white/45">
              Almost done — tell us a little about yourself.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-[11.5px] font-bold tracking-wide text-white/55 uppercase">
              Full name
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              className="h-11 rounded-xl border border-line bg-black/40 px-3 text-[13.5px] focus:border-brand/60 focus:outline-none"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11.5px] font-bold tracking-wide text-white/55 uppercase">
              Date of birth
            </span>
            <input
              type="date"
              value={dob}
              max={today}
              onChange={(e) => setDob(e.target.value)}
              className="h-11 rounded-xl border border-line bg-black/40 px-3 text-[13.5px] [color-scheme:dark] focus:border-brand/60 focus:outline-none"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-[#ffb4b4]">
            {error}
          </p>
        )}

        <p className="mt-3 text-[10.5px] leading-relaxed text-white/35">
          Stored privately with your account ({user.email}) and shown on your Account page.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={skipProfilePrompt}
            className="text-[12px] font-semibold text-white/40 transition hover:text-white/70"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-full bg-brand px-6 text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
