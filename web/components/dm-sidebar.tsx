/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Direct messages sidebar (conversations + friends entry)
*/

"use client";
import { Settings, Users } from "lucide-react";
import type { Conversation, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

export function DmSidebar({ user, conversations, selection, pendingRequestCount, onSelect, onOpenSettings }: {
  user: User;
  conversations: Conversation[];
  selection: string | "friends" | null;
  pendingRequestCount: number;
  onSelect: (selection: string | "friends") => void;
  onOpenSettings: () => void;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar">
      <div className="border-b border-border px-4 py-3.5">
        <span className="font-semibold">Messages privés</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <button
          onClick={() => onSelect("friends")}
          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium ${selection === "friends" ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}
        >
          <Users className="h-4 w-4 text-muted-foreground" /> Amis
          {pendingRequestCount > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-white">{pendingRequestCount}</span>}
        </button>

        <p className="mb-1 mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Messages privés</p>
        {conversations.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Aucune conversation pour l’instant.</p>}
        <ul className="space-y-0.5">
          {conversations.map(c => (
            <li key={c.id}>
              <button onClick={() => onSelect(c.id)} className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm ${selection === c.id ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}>
                <UserAvatar user={c.other_user} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.other_user.username}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.last_message?.content ?? "Aucun message"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2 bg-rail/60 px-2 py-2">
        <UserAvatar user={user} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.username}</p>
          <p className="text-xs text-muted-foreground">En ligne</p>
        </div>
        <button onClick={onOpenSettings} aria-label="Options utilisateur" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
