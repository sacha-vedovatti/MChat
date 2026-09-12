/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Direct message conversation view
*/

"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Pencil, Send, Trash2, X } from "lucide-react";
import type { Conversation, DirectMessage, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

function DirectMessageRow({ message, author, currentUser, onEdit, onDelete }: { message: DirectMessage; author: User; currentUser: User; onEdit: (id: string, content: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const isOwn = message.sender_id === currentUser.id;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.content);
  const [busy, setBusy] = useState(false);

  async function save() {
    const text = value.trim();
    if (!text || text === message.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onEdit(message.id, text);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setValue(message.content);
    setEditing(false);
  }

  return (
    <div className="group flex gap-4 px-4 py-1.5 hover:bg-black/10">
      <UserAvatar user={author} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold">{author.username}</span>
          <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          {isOwn && !editing && (
            <span className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => setEditing(true)} aria-label="Modifier"><Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" /></button>
              <button onClick={() => onDelete(message.id)} aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
            </span>
          )}
        </p>
        {editing ? (
          <div className="mt-1 flex items-start gap-2">
            <input
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); save(); } if (e.key === "Escape") cancel(); }}
              className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-1 text-[15px] outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={save} disabled={busy} aria-label="Enregistrer" className="rounded-md p-1.5 text-primary hover:bg-primary/10 disabled:opacity-50"><Check className="h-4 w-4" /></button>
            <button onClick={cancel} disabled={busy} aria-label="Annuler" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/90">{message.content}</p>
        )}
      </div>
    </div>
  );
}

export function DmView({ conversation, messages, currentUser, onSend, onEdit, onDelete, onOpenProfile }: {
  conversation: Conversation;
  messages: DirectMessage[];
  currentUser: User;
  onSend: (content: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenProfile: () => void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function submit(e: FormEvent) {
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
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 shadow-sm">
        <button onClick={onOpenProfile} className="flex items-center gap-2 hover:opacity-80">
          <UserAvatar user={conversation.other_user} size={24} />
          <h1 className="font-semibold">{conversation.other_user.username}</h1>
        </button>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <div className="px-4 pb-4">
          <UserAvatar user={conversation.other_user} size={64} />
          <h2 className="mt-3 text-2xl font-bold">{conversation.other_user.username}</h2>
          <p className="text-sm text-muted-foreground">C’est le début de votre conversation privée.</p>
        </div>
        {messages.length === 0
          ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun message pour l’instant. Dis bonjour ! 👋</p>
          : messages.map(m => <DirectMessageRow key={m.id} message={m} author={m.sender_id === currentUser.id ? currentUser : conversation.other_user} currentUser={currentUser} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
      <form onSubmit={submit} className="px-4 pb-6 pt-2">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <input value={value} onChange={e => setValue(e.target.value)} placeholder={`Envoyer un message à ${conversation.other_user.username}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button disabled={sending || !value.trim()} aria-label="Envoyer" className="rounded-md p-2 text-primary hover:bg-primary/10 disabled:opacity-40"><Send className="h-5 w-5" /></button>
        </div>
      </form>
    </section>
  );
}
