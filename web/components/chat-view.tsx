/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Chat view component
*/

"use client";
import { Bell, Hash, Inbox, Pin, Search, Send, Users, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Channel, Member, Message, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

function MessageRow({ message, members, currentUser, onDelete, onOpenProfile, onOpenContextMenu }: { message: Message; members: Member[]; currentUser: User; onDelete: (id: string) => void; onOpenProfile: (member: Member) => void; onOpenContextMenu: (member: Member, x: number, y: number) => void }) {
    const authorMember: Member | undefined = members.find(m => m.user.id === message.sender_id) ?? (message.sender_id === currentUser.id ? { user: currentUser, roles: [], joined_at: "" } : undefined);
    const author = authorMember?.user;
    const role = authorMember?.roles[0];

    function openProfile() {
        if (authorMember)
            onOpenProfile(authorMember);
    }

    function openContextMenu(e: React.MouseEvent) {
        e.preventDefault();
        if (authorMember)
            onOpenContextMenu(authorMember, e.clientX, e.clientY);
    }

    return <div className="group flex gap-4 px-4 py-1.5 hover:bg-black/10"><button onClick={openProfile} onContextMenu={openContextMenu} className="shrink-0"><UserAvatar user={author ?? { username: "?", avatar_url: null }} size={40} /></button><div className="min-w-0 flex-1"><p className="flex items-baseline gap-2"><button onClick={openProfile} onContextMenu={openContextMenu} className="text-[15px] font-semibold hover:underline" style={{ color: role?.color ?? "var(--foreground)" }}>{author?.username ?? "Inconnu"}</button><span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>{message.sender_id === currentUser.id && <button onClick={() => onDelete(message.id)} className="ml-2 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>}</p><p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/90">{message.content}</p></div></div>
}

export function ChatView({ channel, messages, members, currentUser, onSend, onDelete, onToggleMembers, membersShown, onOpenProfile, onOpenContextMenu }: { channel: Channel; messages: Message[]; members: Member[]; currentUser: User; onSend: (content: string) => Promise<void>; onDelete: (id: string) => Promise<void>; onToggleMembers: () => void; membersShown: boolean; onOpenProfile: (member: Member) => void; onOpenContextMenu: (member: Member, x: number, y: number) => void }) {
    const [value, setValue] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages]);

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        const text = value.trim();
        if (!text || sending)
            return;
        setSending(true);

        try {
            await onSend(text);
            setValue("");
        } finally {
            setSending(false);
        }
    };

    return <section className="flex min-w-0 flex-1 flex-col bg-background"><header className="flex items-center gap-2 border-b border-border px-4 py-3 shadow-sm"><Hash className="h-5 w-5 text-muted-foreground" /><h1 className="font-semibold">{channel.name}</h1>{channel.description && <><span className="mx-1 h-5 w-px bg-border" /><p className="hidden truncate text-sm text-muted-foreground md:block">{channel.description}</p></>}<div className="ml-auto flex items-center gap-3 text-muted-foreground"><button aria-label="Épingles"><Pin className="h-5 w-5" /></button><button onClick={onToggleMembers} className={membersShown ? "text-foreground" : ""} aria-label="Membres"><Users className="h-5 w-5" /></button><button aria-label="Notifications"><Bell className="h-5 w-5" /></button><div className="relative hidden lg:block"><Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" /><input placeholder="Rechercher" className="h-7 w-36 rounded bg-rail/70 pl-7 pr-2 text-sm outline-none focus:w-52 focus:ring-1 focus:ring-ring" /></div><button aria-label="Boîte de réception"><Inbox className="h-5 w-5" /></button></div></header><div ref={scrollRef} className="flex-1 overflow-y-auto py-4"><div className="px-4 pb-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><Hash className="h-8 w-8" /></div><h2 className="mt-3 text-2xl font-bold">Bienvenue dans #{channel.name}</h2><p className="text-sm text-muted-foreground">C’est le début du salon #{channel.name}.</p></div>{messages.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun message pour l’instant. Lance la conversation ! 💬</p> : messages.map(m => <MessageRow key={m.id} message={m} members={members} currentUser={currentUser} onDelete={onDelete} onOpenProfile={onOpenProfile} onOpenContextMenu={onOpenContextMenu} />)}</div><form onSubmit={submit} className="px-4 pb-6 pt-2"><div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"><input value={value} onChange={e => setValue(e.target.value)} placeholder={`Envoyer un message dans #${channel.name}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button disabled={sending || !value.trim()} aria-label="Envoyer" className="rounded-md p-2 text-primary hover:bg-primary/10 disabled:opacity-40"><Send className="h-5 w-5" /></button></div></form></section>
}
