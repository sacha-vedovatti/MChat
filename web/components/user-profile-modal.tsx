/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User profile card modal
*/

"use client";
import { useEffect, useState } from "react";
import { X, MessageCircle, UserPlus, ShieldOff, Pencil, Check } from "lucide-react";
import type { Member, User } from "../lib/types";
import { UserAvatar } from "./user-avatar";
import { sendFriendRequest } from "@/lib/api/social";

type ActionState = "idle" | "busy" | "done" | "error";

export function UserProfileModal({
  member,
  currentUser,
  onClose,
  onEditProfile,
  onOpenDM,
  onBlocked,
}: {
  member: Member;
  currentUser: User;
  onClose: () => void;
  onEditProfile?: () => void;
  onOpenDM?: (userId: string) => void;
  onBlocked?: (userId: string) => Promise<void>;
}) {
  const isSelf = member.user.id === currentUser.id;
  const visibleRoles = member.roles.filter(role => !role.is_default);
  const primaryRole = visibleRoles[0];
  const [friendState, setFriendState] = useState<ActionState>("idle");
  const [friendError, setFriendError] = useState("");
  const [blockState, setBlockState] = useState<ActionState>("idle");
  const [blockError, setBlockError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")
        onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleAddFriend() {
    setFriendState("busy");
    setFriendError("");
    try {
      await sendFriendRequest(member.user.id);
      setFriendState("done");
    } catch (err) {
      setFriendState("error");
      setFriendError(err instanceof Error ? err.message : "Impossible d’envoyer la demande");
    }
  }

  async function handleBlock() {
    if (!window.confirm(`Bloquer ${member.user.username} ? Vous ne verrez plus ses messages.`))
      return;
    setBlockState("busy");
    setBlockError("");
    try {
      if (!onBlocked)
        throw new Error("Action indisponible");
      await onBlocked(member.user.id);
      onClose();
    } catch (err) {
      setBlockState("error");
      setBlockError(err instanceof Error ? err.message : "Impossible de bloquer");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
        <div className="h-16" style={{ backgroundColor: primaryRole?.color ?? "var(--secondary)" }} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-popover"><UserAvatar user={member.user} size={80} /></div>
            <button onClick={onClose} aria-label="Fermer" className="mb-1 rounded-full border border-border bg-popover p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h1 className="mt-3 truncate text-lg font-bold">{member.user.username}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {visibleRoles.length > 0 ? (
              visibleRoles.map(role => <span key={role.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                {role.name}
              </span>)
            ) : ("")
            }
          </div>

          <dl className="mt-4 space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
            {isSelf && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">E-mail</dt><dd className="truncate font-medium">{member.user.email}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Membre depuis</dt><dd className="font-medium">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}</dd></div>
          </dl>

          {isSelf ? (
            onEditProfile && <button onClick={onEditProfile} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              <Pencil className="h-4 w-4" /> Modifier mon profil
            </button>
          ) : (
            <div className="mt-4 space-y-2">
              <button
                onClick={onOpenDM ? () => { onOpenDM(member.user.id); onClose(); } : undefined}
                disabled={!onOpenDM}
                className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" /> Message privé
              </button>

              <button onClick={handleAddFriend} disabled={friendState === "busy" || friendState === "done"} className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-accent disabled:opacity-70">
                {friendState === "done" ? <><Check className="h-4 w-4 text-primary" /> Demande envoyée</> : <><UserPlus className="h-4 w-4" /> {friendState === "busy" ? "Envoi…" : "Ajouter en ami"}</>}
              </button>
              {friendState === "error" && <p className="text-xs text-destructive">{friendError}</p>}

              <button onClick={handleBlock} disabled={blockState === "busy" || blockState === "done"} className="flex h-10 w-full items-center gap-2 rounded-md border border-destructive/30 bg-card px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-70">
                <ShieldOff className="h-4 w-4" /> {blockState === "busy" ? "Blocage…" : "Bloquer"}
              </button>
              {blockState === "error" && <p className="text-xs text-destructive">{blockError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
