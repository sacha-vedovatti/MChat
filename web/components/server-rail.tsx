/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server list component
*/

"use client";
import { Compass, Plus, MessageCircle, LogOut } from "lucide-react";
import type { Server } from "../lib/types";

export function ServerRail({ servers, activeServerId, dmActive, onSelect, onOpenDirectMessages, onCreate, onLogout }: { servers: Server[]; activeServerId: string | null; dmActive: boolean; onSelect: (id: string) => void; onOpenDirectMessages: () => void; onCreate: () => void; onLogout: () => void }) {
    const button = (label: string, active: boolean, onClick: () => void, content: React.ReactNode) => <div className="group relative flex justify-center"><button onClick={onClick} aria-label={label} className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition-all ${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:rounded-xl hover:bg-accent"}`}>{content}</button><span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-2 text-sm opacity-0 shadow-lg group-hover:opacity-100">{label}</span></div>;

    return <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-rail py-3"><>{button("Messages directs", dmActive, onOpenDirectMessages, <MessageCircle className="h-5 w-5" />)}</><div className="my-1 h-px w-8 bg-border" /><div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">{servers.map(s => button(s.name, !dmActive && s.id === activeServerId, () => onSelect(s.id), s.name.slice(0, 2).toUpperCase()))}{button("Ajouter un serveur", false, onCreate, <Plus className="h-5 w-5" />)}{button("Explorer", false, () => { }, <Compass className="h-5 w-5" />)}</div><div className="my-1 h-px w-8 bg-border" /><button onClick={onLogout} aria-label="Se déconnecter" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="h-5 w-5" /></button></nav>
}
