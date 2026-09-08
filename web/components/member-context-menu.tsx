/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Member context menu component (right click)
*/

"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { User, MessageCircle, UserPlus, ShieldOff, ShieldCheck, ChevronRight, Check, LogOut, Ban } from "lucide-react";
import { banMember, kickMember, updateMemberRole } from "../lib/api/members";
import { blockUser, sendFriendRequest } from "../lib/api/social";
import { hasPermission } from "../lib/permissions";
import type { Member, Role, Server, User as UserType } from "../lib/types";

export function MemberContextMenu({x, y, member, server, roles, currentUser, currentUserRole, isOwner, onClose, onOpenProfile, onRoleAssigned, onKicked, onBanned }: {
  x: number;
  y: number;
  member: Member;
  server: Server;
  roles: Role[];
  currentUser: UserType;
  currentUserRole: Role | null;
  isOwner: boolean;
  onClose: () => void;
  onOpenProfile: (member: Member) => void;
  onRoleAssigned: (member: Member) => void;
  onKicked: (userId: string) => void;
  onBanned: (userId: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [rolesOpen, setRolesOpen] = useState(false);
  const [friendState, setFriendState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [busyAction, setBusyAction] = useState<"kick" | "ban" | "role" | null>(null);
  const [error, setError] = useState("");

  const isSelf = member.user.id === currentUser.id;
  const isTargetOwner = member.user.id === server.owner_id;
  const canManageRoles = isSelf ? isOwner : !isTargetOwner && (isOwner || hasPermission(currentUserRole, "MANAGE_ROLES"));
  const canKick = !isSelf && !isTargetOwner && (isOwner || hasPermission(currentUserRole, "KICK_MEMBERS"));
  const canBan = !isSelf && !isTargetOwner && (isOwner || hasPermission(currentUserRole, "BAN_MEMBERS"));

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el)
      return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 8);
    const top = Math.min(y, window.innerHeight - rect.height - 8);
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y, rolesOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")
        onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  async function handleAddFriend() {
    setFriendState("busy");
    try {
      await sendFriendRequest(member.user.id);
      setFriendState("done");
    } catch {
      setFriendState("error");
    }
  }

  async function handleBlock() {
    if (!window.confirm(`Bloquer ${member.user.username} ?`))
      return;
    try {
      await blockUser(member.user.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de bloquer");
    }
  }

  async function handleAssignRole(role: Role) {
    setBusyAction("role");
    setError("");
    try {
      const updated = await updateMemberRole(server.id, member.user.id, role.id);
      onRoleAssigned(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’assigner ce rôle");
      setBusyAction(null);
    }
  }

  async function handleKick() {
    if (!window.confirm(`Expulser ${member.user.username} du serveur ?`))
      return;
    setBusyAction("kick");
    setError("");
    try {
      await kickMember(server.id, member.user.id);
      onKicked(member.user.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’expulser ce membre");
      setBusyAction(null);
    }
  }

  async function handleBan() {
    if (!window.confirm(`Bannir définitivement ${member.user.username} ?`))
      return;
    setBusyAction("ban");
    setError("");
    try {
      await banMember(server.id, member.user.id);
      onBanned(member.user.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de bannir ce membre");
      setBusyAction(null);
    }
  }

  const itemClass = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div ref={menuRef} style={{ left: pos.left, top: pos.top }} className="fixed z-50 w-56 overflow-hidden rounded-lg border border-border bg-popover py-1.5 shadow-xl">
        <button onClick={() => onOpenProfile(member)} className={itemClass}><User className="h-4 w-4 text-muted-foreground" /> Profil</button>

        <div className="my-1 h-px bg-border" />

        <button disabled title="Bientôt disponible" className={itemClass}>
          <MessageCircle className="h-4 w-4 text-muted-foreground" /> Message privé
          <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">Bientôt</span>
        </button>

        {!isSelf && (
          <button onClick={handleAddFriend} disabled={friendState === "busy" || friendState === "done"} className={itemClass}>
            {friendState === "done" ? <Check className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-muted-foreground" />}
            {friendState === "done" ? "Ami ajouté" : friendState === "busy" ? "Envoi…" : "Ajouter en ami"}
          </button>
        )}

        {!isSelf && (
          <button onClick={handleBlock} className={`${itemClass} text-destructive`}>
            <ShieldOff className="h-4 w-4" /> Bloquer
          </button>
        )}

        {canManageRoles && (
          <>
            <div className="my-1 h-px bg-border" />
            <button onClick={() => setRolesOpen(v => !v)} className={itemClass}>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Rôles
              <ChevronRight className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${rolesOpen ? "rotate-90" : ""}`} />
            </button>
            {rolesOpen && (
              <div className="mx-2 mb-1 max-h-48 overflow-y-auto rounded-md border border-border bg-card py-1">
                {roles.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Aucun rôle disponible.</p>}
                {[...roles].sort((a, b) => a.position - b.position).map(role => (
                  <button key={role.id} disabled={busyAction === "role"} onClick={() => handleAssignRole(role)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-50">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="truncate">{role.name}</span>
                    {member.role?.id === role.id && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {(canKick || canBan) && <div className="my-1 h-px bg-border" />}
        {canKick && (
          <button onClick={handleKick} disabled={busyAction === "kick"} className={`${itemClass} text-destructive`}>
            <LogOut className="h-4 w-4" /> {busyAction === "kick" ? "Expulsion…" : "Expulser"}
          </button>
        )}
        {canBan && (
          <button onClick={handleBan} disabled={busyAction === "ban"} className={`${itemClass} text-destructive`}>
            <Ban className="h-4 w-4" /> {busyAction === "ban" ? "Bannissement…" : "Bannir"}
          </button>
        )}

        {error && <p className="border-t border-border px-3 py-2 text-xs text-destructive">{error}</p>}
      </div>
    </>
  );
}
