import { useEffect, useState } from "react";
import { initials } from "@/lib/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

/** Resolves either a plain URL or a storage path in the private friend-photos bucket. */
export function useResolvedPhoto(photoUrl?: string | null) {
  const [src, setSrc] = useState<string | null>(
    photoUrl && /^(https?:|data:|blob:)/.test(photoUrl) ? photoUrl : null,
  );

  useEffect(() => {
    let active = true;
    if (!photoUrl) {
      setSrc(null);
      return;
    }
    if (/^(https?:|data:|blob:)/.test(photoUrl)) {
      setSrc(photoUrl);
      return;
    }
    supabase.storage
      .from("friend-photos")
      .createSignedUrl(photoUrl, 60 * 60)
      .then(({ data }) => {
        if (active) setSrc(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [photoUrl]);

  return src;
}

export function FriendAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  const src = useResolvedPhoto(photoUrl);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn("size-11 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-semibold text-secondary-foreground",
        className,
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
