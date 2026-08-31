/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Channel sidebar component
*/

"use client";
import { ChevronDown, Hash, Plus, Settings } from "lucide-react";
import { useState } from "react";
import type { Channel, Server, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

export function ChannelSidebar({ server, user, channels, activeChannelId, onSelect, onCreateChannel, onOpenSettings }: { server: Server; user: User; channels: Channel[]; activeChannelId: string | null; onSelect: (id: string) => void; onCreateChannel: () => void; onOpenSettings: () => void }) {
    const [collapsed, setCollapsed] = useState(false);

    return <aside className="flex w-60 shrink-0 flex-col bg-sidebar"><button className="flex items-center justify-between border-b border-border px-4 py-3.5 text-left"><span className="truncate font-semibold">{server.name}</span><Settings className="h-4 w-4 text-muted-foreground" /></button><div className="flex-1 overflow-y-auto px-2 py-3"><button onClick={() => setCollapsed(v => !v)} className="flex w-full items-center gap-1 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} /><span className="flex-1 text-left">Salons</span><span onClick={e => { e.stopPropagation(); onCreateChannel() }} className="rounded p-1 hover:bg-accent"><Plus className="h-4 w-4" /></span></button>{!collapsed && <ul className="mt-1 space-y-0.5">{channels.map(ch => <li key={ch.id}><button disabled={!ch.name} onClick={() => onSelect(ch.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${activeChannelId === ch.id ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"}`}><>{ch.description === null ? <Hash className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}</><span className="truncate">{ch.name}</span></button></li>)}</ul>}{channels.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">Aucun salon.</p>}</div><div className="flex items-center gap-2 bg-rail/60 px-2 py-2"><UserAvatar user={user} size={32} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.username}</p><p className="text-xs text-muted-foreground">En ligne</p></div><button onClick={onOpenSettings} aria-label="Options utilisateur" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="h-4 w-4" /></button></div></aside>
}
