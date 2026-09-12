/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Friends management panel
*/

"use client";
import { FormEvent, useState } from "react";
import { Check, Loader2, MessageCircle, Search, ShieldOff, UserMinus, UserPlus, X } from "lucide-react";
import { searchUsers } from "../lib/api/users";
import type { BlockedUser, Friend, FriendRequest, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

export function FriendsPanel({ currentUser, friends, requests, blockedUsers, onSendRequest, onAcceptRequest, onDenyRequest, onRemoveFriend, onUnblockUser, onOpenDM }: {
  currentUser: User;
  friends: Friend[];
  requests: FriendRequest[];
  blockedUsers: BlockedUser[];
  onSendRequest: (userId: string) => Promise<void>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (userId: string) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
  onOpenDM: (userId: string) => void;
}) {
  const incoming = requests.filter(r => r.direction !== "outgoing");
  const outgoing = requests.filter(r => r.direction === "outgoing");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();

    const q = query.trim();
    if (!q)
      return;
    setSearching(true);
    setSearchError("");

    try {
      const users = await searchUsers(q);
      setResults(users.filter(u => u.id !== currentUser.id));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Recherche indisponible pour le moment");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSend(userId: string) {
    setPendingAction(userId);

    try {
      await onSendRequest(userId);
      setSentTo(prev => new Set(prev).add(userId));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      <header className="border-b border-border px-6 py-4"><h1 className="text-lg font-bold">Amis</h1></header>

      <div className="mx-auto w-full max-w-2xl px-6 py-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un utilisateur par pseudo…" className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={searching || !query.trim()} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}</button>
        </form>
        {searchError && <p className="mt-2 text-xs text-destructive">{searchError}</p>}

        {results.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-lg border border-border bg-card p-2">
            {results.map(u => (
              <li key={u.id} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                <UserAvatar user={u} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{u.username}</span>
                <button onClick={() => handleSend(u.id)} disabled={pendingAction === u.id || sentTo.has(u.id)} className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-60">
                  {sentTo.has(u.id) ? <><Check className="h-3.5 w-3.5" /> Envoyée</> : <><UserPlus className="h-3.5 w-3.5" /> Ajouter</>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {incoming.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandes reçues — {incoming.length}</h2>
            <ul className="space-y-1">
              {incoming.map(r => (
                <li key={r.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <UserAvatar user={r.user} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.user.username}</span>
                  <button onClick={() => onAcceptRequest(r.id)} aria-label="Accepter" className="rounded-md bg-primary p-1.5 text-primary-foreground hover:opacity-90"><Check className="h-4 w-4" /></button>
                  <button onClick={() => onDenyRequest(r.id)} aria-label="Refuser" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandes envoyées — {outgoing.length}</h2>
            <ul className="space-y-1">
              {outgoing.map(r => (
                <li key={r.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <UserAvatar user={r.user} size={36} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.user.username}</span>
                  <span className="text-xs text-muted-foreground">En attente</span>
                  <button onClick={() => onDenyRequest(r.id)} aria-label="Annuler la demande" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tous les amis — {friends.length}</h2>
          {friends.length === 0 && <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Tu n’as pas encore d’amis. Utilise la recherche ci-dessus pour en ajouter.</p>}
          <ul className="space-y-1">
            {friends.map(f => (
              <li key={f.friend.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                <UserAvatar user={f.friend} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.friend.username}</p>
                  <p className="text-xs text-muted-foreground">Ami depuis le {new Date(f.since).toLocaleDateString()}</p>
                </div>
                <button onClick={() => onOpenDM(f.friend.id)} aria-label="Envoyer un message" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><MessageCircle className="h-4 w-4" /></button>
                <button onClick={() => onRemoveFriend(f.friend.id)} aria-label="Retirer" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><UserMinus className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Utilisateurs bloqués — {blockedUsers.length}</h2>
          {blockedUsers.length === 0 && <p className="rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">Aucun utilisateur bloqué.</p>}
          <ul className="space-y-1">
            {blockedUsers.map(blocked => (
              <li key={blocked.user.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                <UserAvatar user={blocked.user} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{blocked.user.username}</span>
                <button onClick={() => onUnblockUser(blocked.user.id)} aria-label="Débloquer" className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs font-semibold hover:bg-accent"><ShieldOff className="h-3.5 w-3.5" /> Débloquer</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
