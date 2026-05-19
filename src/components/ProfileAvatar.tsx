import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  size?: number;
  className?: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
}

function initialsFrom(name?: string | null, email?: string | null): string {
  const src = (name || email || "").trim();
  if (!src) return "·";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return src[0]?.toUpperCase() || "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Hook to fetch profile (avatar + name) for the current user.
 */
export function useCurrentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as any) || { avatar_url: null, display_name: null });
      });

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<{ avatar_url: string | null; display_name: string | null }>;
      if (!detail) return;
      setProfile(prev => ({
        avatar_url: detail.avatar_url !== undefined ? detail.avatar_url : (prev?.avatar_url ?? null),
        display_name: detail.display_name !== undefined ? detail.display_name : (prev?.display_name ?? null),
      }));
    };
    window.addEventListener("profile:updated", onUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("profile:updated", onUpdate);
    };
  }, [user?.id]);

  return { profile, email: user?.email ?? null };
}

export function emitProfileUpdated(detail: Partial<{ avatar_url: string | null; display_name: string | null }>) {
  window.dispatchEvent(new CustomEvent("profile:updated", { detail }));
}

export const ProfileAvatar = ({
  size = 36,
  className,
  avatarUrl,
  displayName,
  email,
}: ProfileAvatarProps) => {
  const initials = initialsFrom(displayName, email);
  const fontSize = Math.max(11, Math.round(size * 0.4));

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center text-white font-semibold select-none",
        "gradient-peach",
        "ring-1 ring-border/40",
        className
      )}
      style={{ width: size, height: size, fontSize }}
      aria-label="Avatar utilisateur"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <span style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>{initials}</span>
      )}
    </div>
  );
};
