/*
 ** EPITECH PROJECT, 2026
 ** MChat
 ** File description:
 ** Channel sidebar component
 */

"use client";
import { ChevronDown, Hash, Plus, Settings, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";
import type { Channel, Server, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

export function ChannelSidebar({ server, user, channels, activeChannelId, isOwner, onSelect, onCreateChannel, onEditChannel, onOpenSettings, onOpenServerSettings, onOpenInvite }: {
  server: Server;
  user: User;
  channels: Channel[];
  activeChannelId: string | null | undefined;
  isOwner: boolean;
  onSelect: (id: string) => void;
  onCreateChannel: () => void;
  onEditChannel: (channel: Channel) => void;
  onOpenSettings: () => void;
  onOpenServerSettings: () => void;
  onOpenInvite: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar">
      <div className="border-b border-border">
        <button
          onClick={onOpenServerSettings}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-sidebar-accent/40"
        >
          <span className="truncate font-semibold">{server.name}</span>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onOpenInvite}
          className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60"
        >
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <span>Inviter des membres</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-1 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
          <span className="flex-1 text-left">Salons</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onCreateChannel();
            }}
            aria-label="Créer un salon"
            className="rounded p-1 hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </span>
        </button>
        {!collapsed && (
          <ul className="mt-1 space-y-0.5">
            {channels.map((ch) => (
              <li key={ch.id} className="group/channel flex items-center">
                <button
                  disabled={!ch.name}
                  onClick={() => onSelect(ch.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm ${activeChannelId === ch.id ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}
                >
                  <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{ch.name}</span>
                </button>
                {isOwner && (
                  <button
                    onClick={() => onEditChannel(ch)}
                    aria-label={`Modifier #${ch.name}`}
                    className="mr-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover/channel:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {channels.length === 0 && (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun salon pour l’instant.
            </p>
            <button
              onClick={onCreateChannel}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Créer un salon
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 bg-rail/60 px-2 py-2">
        <UserAvatar user={user} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.username}</p>
          <p className="text-xs text-muted-foreground">En ligne</p>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Options utilisateur"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
