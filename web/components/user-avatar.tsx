/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User avatar component
*/

import { cn } from "../lib/utils";
import type { User } from "../lib/types";

function colorFor(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return `oklch(0.6 0.14 ${Math.abs(hash) % 360})`;
}

export function UserAvatar({ user, size = 40, className }: { user: Pick<User, "username" | "avatar_url">; size?: number; className?: string }) {
  const initial = user.username.trim().slice(0, 1).toUpperCase() || "?";

  return <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white", className)} style={{ width: size, height: size, backgroundColor: colorFor(user.username) }}>{user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}</div>
}
