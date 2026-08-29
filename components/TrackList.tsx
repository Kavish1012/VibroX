import type { Track } from "../types";
import { usePlayer } from "../store/player";
import TrackRow from "./TrackRow";

interface Props {
  tracks: Track[];
  onDelete?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  emptyState?: React.ReactNode;
}

export default function TrackList({ tracks, onDelete, onRemove, emptyState }: Props) {
  const { currentId, isPlaying, coverFor, play, toggleLike, addToQueue, toggle, openAddToPlaylist } =
    usePlayer();

  if (!tracks.length) return <>{emptyState}</>;

  return (
    <div className="grid">
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          coverUrl={coverFor(track)}
          active={currentId === track.id}
          playing={currentId === track.id && isPlaying}
          onPlay={() => (currentId === track.id ? toggle() : play(track))}
          onLike={() => toggleLike(track)}
          onQueue={() => addToQueue(track)}
          onAddToPlaylist={() => openAddToPlaylist(track)}
          onDelete={onDelete ? () => onDelete(track) : undefined}
          onRemove={onRemove ? () => onRemove(track) : undefined}
        />
      ))}
    </div>
  );
}
