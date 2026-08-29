import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import CoverArt from "./CoverArt";
import { CloseIcon, PlayIcon, PlusIcon } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QueuePanel({ open, onClose }: Props) {
  const { tracks, queue, current, currentId, coverFor, isPlaying, play, removeFromQueue, addToQueue, clearQueue } =
    usePlayer();

  const queued = queue
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const excluded = new Set([currentId, ...queue]);
  const recommended = tracks.filter((t) => !excluded.has(t.id)).slice(0, 4);

  const Row = ({
    id,
    title,
    artist,
    cover,
    now,
    action,
    onAction,
  }: {
    id: string;
    title: string;
    artist: string;
    cover?: string;
    now?: boolean;
    action: "remove" | "add" | null;
    onAction: () => void;
  }) => (
    <div
      onClick={() => {
        const t = tracks.find((x) => x.id === id);
        if (t) play(t);
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06]"
    >
      <CoverArt track={{ id, title, artist, album: "", duration: 0, liked: false, playCount: 0, createdAt: 0 }} url={cover} className="h-11 w-11 shrink-0" rounded="rounded-lg" playing={now && isPlaying} />
      <span className="min-w-0 flex-1">
        <b className={cn("block truncate text-[12.5px] font-bold", now && "text-brand")}>{title}</b>
        <span className="mt-0.5 block truncate text-[11px] text-white/45">{artist}</span>
      </span>
      {action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          aria-label={action === "add" ? "Add to queue" : "Remove from queue"}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white",
            action === "add" && "text-brand hover:text-brand-soft",
          )}
        >
          {action === "add" ? <PlusIcon width={15} height={15} /> : <CloseIcon width={14} height={14} />}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-line bg-[#101010] transition-transform duration-300 ease-out",
          "h-full lg:static lg:z-auto lg:max-w-none lg:w-[330px] lg:shrink-0 lg:transition-all lg:duration-300",
          open ? "translate-x-0" : "translate-x-full lg:w-0 lg:translate-x-full lg:overflow-hidden lg:border-l-0",
        )}
        aria-label="Up next queue"
        // While closed, `inert` removes the drawer AND all of its buttons from
        // the tab order and the accessibility tree, so keyboard and screen
        // reader users can never focus invisible controls (WCAG 1.3.1 / 4.1.2).
        // While open, no aria-hidden is present, so everything is announced.
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
          <h2 className="text-[17px] font-extrabold tracking-tight">Up Next</h2>
          <button
            onClick={onClose}
            aria-label="Close queue"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={15} height={15} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3.5 pt-4 pb-24 lg:pb-6">
          <h3 className="px-1.5 pb-2 text-[10.5px] font-bold tracking-[0.16em] text-white/35 uppercase">
            Now playing
          </h3>
          {current ? (
            <Row
              id={current.id}
              title={current.title}
              artist={current.artist}
              cover={coverFor(current)}
              now
              action={null}
              onAction={() => undefined}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-white/40">
              Nothing playing. Start a song from your library.
            </p>
          )}

          <h3 className="px-1.5 pt-6 pb-2 text-[10.5px] font-bold tracking-[0.16em] text-white/35 uppercase">
            Next in queue
          </h3>
          {queued.length ? (
            <>
              {queued.map((t) => (
                <Row
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  artist={t.artist}
                  cover={coverFor(t)}
                  action="remove"
                  onAction={() => removeFromQueue(t.id)}
                />
              ))}
              <button
                onClick={clearQueue}
                className="mt-3 w-full rounded-xl border border-line py-2.5 text-[12px] font-semibold text-white/60 transition hover:border-danger/40 hover:text-danger"
              >
                Clear queue
              </button>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-white/40">
              Queue is empty — use the + on any track to line it up.
            </p>
          )}

          <h3 className="px-1.5 pt-6 pb-2 text-[10.5px] font-bold tracking-[0.16em] text-white/35 uppercase">
            Recommended
          </h3>
          {recommended.length ? (
            recommended.map((t) => (
              <Row
                key={t.id}
                id={t.id}
                title={t.title}
                artist={t.artist}
                cover={coverFor(t)}
                action="add"
                onAction={() => addToQueue(t)}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-white/40">
              That's everything in your library.
            </p>
          )}

          {current && (
            <button
              onClick={() => current && play(current)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[12.5px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
            >
              <PlayIcon width={14} height={14} /> Restart current track
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
