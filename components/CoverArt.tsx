import { useState } from "react";
import type { Track } from "../types";
import { cn } from "../utils/cn";
import { gradientFor, initials } from "../lib/format";
import { safeImageUrl } from "../lib/safe";

interface Props {
  track: Track;
  url?: string;
  className?: string;
  rounded?: string;
  playing?: boolean;
}

export default function CoverArt({ track, url, className, rounded = "rounded-xl", playing }: Props) {
  const [failed, setFailed] = useState(false);
  const safeUrl = safeImageUrl(url);
  const showImage = Boolean(safeUrl) && !failed;

  return (
    <div
      className={cn(
        "@container relative overflow-hidden bg-elev shadow-lg shadow-black/40",
        rounded,
        className,
      )}
      style={showImage ? undefined : { backgroundImage: gradientFor(track.id) }}
    >
      {showImage ? (
        <img
          src={safeUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[clamp(14px,26cqw,52px)] font-black tracking-tight text-white/85">
            {initials(track.title)}
          </span>
        </div>
      )}
      {playing && (
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" aria-hidden>
          <div className="flex h-full items-end justify-center gap-[3px] pb-[18%]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[6%] animate-bar rounded-full bg-brand"
                style={{ animationDelay: `${i * 0.13}s`, height: "40%" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
