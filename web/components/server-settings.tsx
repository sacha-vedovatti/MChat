/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server settings modal component (info, roles)
*/

"use client";
import { FormEvent, useEffect, useState } from "react";
import { X, Info, ShieldCheck, ShieldAlert, Check, Plus, Trash2, ChevronLeft, ChevronUp, ChevronDown, GripVertical, Copy, Link } from "lucide-react";
import { createInvitation, deleteServer, updateServer } from "../lib/api/servers";
import { PERMISSIONS } from "../lib/permissions";
import type { Role, Server } from "../lib/types";
import { createRole, deleteRole, updateRole } from "@/lib/api/roles";

type Tab = "overview" | "roles" | "danger";

export function ServerSettingsModal({ server, roles, isOwner, onClose, onServerUpdated, onServerDeleted, onRolesChanged }: {
  server: Server;
  roles: Role[];
  isOwner: boolean;
  onClose: () => void;
  onServerUpdated: (server: Server) => void;
  onServerDeleted: () => void;
  onRolesChanged: (roles: Role[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")
        onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const navItem = (id: Tab, label: string, icon: React.ReactNode, danger = false) => (
    <button
      onClick={() => setTab(id)}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${tab === id ? "bg-accent text-foreground" : danger ? "text-destructive hover:bg-accent/60" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" onClick={onClose}>
      <div className="flex w-full" onClick={e => e.stopPropagation()}>
        <div className="hidden w-64 shrink-0 bg-popover px-3 py-8 sm:block">
          <p className="mb-2 truncate px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{server.name}</p>
          <nav className="space-y-0.5">
            {navItem("overview", "Vue d’ensemble", <Info className="h-4 w-4" />)}
            {navItem("roles", "Rôles", <ShieldCheck className="h-4 w-4" />)}
            {isOwner && navItem("danger", "Zone de danger", <ShieldAlert className="h-4 w-4" />, true)}
          </nav>
        </div>
        <div className="relative flex-1 overflow-y-auto bg-background px-6 py-10 sm:px-12">
          <button onClick={onClose} aria-label="Fermer" className="absolute right-6 top-8 rounded-full border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto max-w-2xl">
            {!isOwner && (
              <p className="mb-6 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Seul le propriétaire du serveur peut modifier ces paramètres. Tu peux consulter les informations en lecture seule.
              </p>
            )}
            {tab === "overview" && <OverviewTab server={server} isOwner={isOwner} onServerUpdated={onServerUpdated} />}
            {tab === "roles" && <RolesTab server={server} roles={roles} isOwner={isOwner} onRolesChanged={onRolesChanged} />}
            {tab === "danger" && isOwner && <DangerTab server={server} onServerDeleted={onServerDeleted} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ server, isOwner, onServerUpdated }: { server: Server; isOwner: boolean; onServerUpdated: (server: Server) => void }) {
  const [name, setName] = useState(server.name);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const dirty = name.trim() !== server.name;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty)
      return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateServer(server.id, name.trim());
      onServerUpdated(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le serveur");
    } finally {
      setBusy(false);
    }
  }

  async function generateInvite() {
    setInviteBusy(true);
    setInviteError("");
    setCopied(false);
    try {
      const invitation = await createInvitation(server.id, 24 * 60 * 60);
      setInviteLink(`${window.location.origin}${invitation.invite_path}`);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Impossible de créer le lien d’invitation");
    } finally {
      setInviteBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteLink)
      return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-bold">Vue d’ensemble</h1>
      <p className="mt-1 text-sm text-muted-foreground">Informations générales du serveur.</p>

      <label className="mt-6 block text-sm">Nom du serveur
        <input value={name} onChange={e => setName(e.target.value)} required minLength={2} disabled={!isOwner} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />
      </label>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm">
        <div><dt className="text-muted-foreground">Créé le</dt><dd className="mt-0.5 font-medium">{new Date(server.created_at).toLocaleDateString()}</dd></div>
        <div><dt className="text-muted-foreground">Identifiant</dt><dd className="mt-0.5 truncate font-mono text-xs font-medium">{server.id}</dd></div>
      </dl>

      {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && !error && <p className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"><Check className="h-4 w-4" /> Serveur mis à jour.</p>}

      <section className="mt-8 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Invitation</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Crée un lien valable pendant 24 heures pour inviter quelqu’un.</p>
        {inviteLink && <div className="mt-3 flex gap-2">
          <input readOnly value={inviteLink} aria-label="Lien d’invitation" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none" />
          <button type="button" onClick={copyInvite} aria-label="Copier le lien" title="Copier le lien" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-accent"><Copy className="h-4 w-4" />{copied ? "Copié" : "Copier"}</button>
        </div>}
        {inviteError && <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{inviteError}</p>}
        {isOwner && <button type="button" onClick={generateInvite} disabled={inviteBusy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{inviteBusy ? "Génération…" : "Générer un lien"}</button>}
      </section>

      {isOwner && (
        <div className="mt-6 flex justify-end gap-3">
          <button type="submit" disabled={!dirty || busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      )}
    </form>
  );
}

function RolesTab({ server, roles, isOwner, onRolesChanged }: { server: Server; roles: Role[]; isOwner: boolean; onRolesChanged: (roles: Role[]) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const sorted = [...roles].sort((a, b) => a.position - b.position);
  const selected = sorted.find(r => r.id === selectedId) ?? null;

  async function handleCreate() {
    setError("");
    setCreating(true);
    try {
      const names = new Set(roles.map(role => role.name.toLowerCase()));
      let name = "new";
      let suffix = 2;
      while (names.has(name)) {
        name = `new ${suffix}`;
        suffix += 1;
      }
      const role = await createRole(server.id, { name, permissions: [] });
      onRolesChanged([...roles, role]);
      setSelectedId(role.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le rôle");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!window.confirm(`Supprimer le rôle « ${role.name} » ?`))
      return;
    setError("");
    try {
      await deleteRole(server.id, role.id);
      const next = roles.filter(r => r.id !== role.id);
      onRolesChanged(next);
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le rôle");
    }
  }

  async function handleMove(role: Role, direction: -1 | 1) {
    const index = sorted.findIndex(currentRole => currentRole.id === role.id);
    const target = sorted[index + direction];
    if (!target || movingId !== null)
      return;

    setMovingId(role.id);
    setError("");
    try {
      const [updatedRole, updatedTarget] = await Promise.all([
        updateRole(server.id, role.id, { position: target.position }),
        updateRole(server.id, target.id, { position: role.position }),
      ]);
      onRolesChanged(roles.map(currentRole => {
        if (currentRole.id === updatedRole.id)
          return updatedRole;
        if (currentRole.id === updatedTarget.id)
          return updatedTarget;
        return currentRole;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de déplacer le rôle");
    } finally {
      setMovingId(null);
    }
  }

  async function handleDrop(targetId: number) {
    if (draggedId === null || draggedId === targetId || movingId !== null)
      return;

    const sourceIndex = sorted.findIndex(role => role.id === draggedId);
    const targetIndex = sorted.findIndex(role => role.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0)
      return;

    const reordered = [...sorted];
    const [draggedRole] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, draggedRole);
    const updates = reordered
      .map((role, index) => ({ role, position: index }))
      .filter(({ role, position }) => role.position !== position);

    setMovingId(draggedId);
    setError("");
    try {
      const updatedRoles = await Promise.all(
        updates.map(({ role, position }) => updateRole(server.id, role.id, { position })),
      );
      const updatedById = new Map(updatedRoles.map(role => [role.id, role]));
      onRolesChanged(reordered.map(role => updatedById.get(role.id) ?? role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de déplacer le rôle");
    } finally {
      setMovingId(null);
      setDraggedId(null);
      setDragOverId(null);
    }
  }

  if (selected) {
    return (
      <RoleEditor
        server={server}
        role={selected}
        isOwner={isOwner}
        onBack={() => setSelectedId(null)}
        onSaved={updated => onRolesChanged(roles.map(r => (r.id === updated.id ? updated : r)))}
        onDelete={() => handleDelete(selected)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Rôles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gère les rôles et leurs permissions sur ce serveur.</p>
        </div>
        {isOwner && (
          <button onClick={handleCreate} disabled={creating} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" /> Créer un rôle
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <ul className="mt-5 space-y-1">
        {sorted.map(role => (
          <li
            key={role.id}
            draggable={isOwner && movingId === null}
            onDragStart={event => {
              if (!isOwner)
                return;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(role.id));
              setDraggedId(role.id);
            }}
            onDragOver={event => {
              event.preventDefault();
              if (draggedId !== role.id)
                setDragOverId(role.id);
            }}
            onDrop={event => {
              event.preventDefault();
              void handleDrop(role.id);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
            className={`flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent ${draggedId === role.id ? "opacity-50" : ""} ${dragOverId === role.id ? "border-primary" : ""}`}
          >
            {isOwner && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-label="Déplacer le rôle" />}
            <button onClick={() => setSelectedId(role.id)} className="flex min-w-0 flex-1 items-center justify-between py-1 text-left">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                <span style={{ color: role.color }}>{role.name}</span>
                {role.is_default && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">Par défaut</span>}
              </span>
              <span className="text-xs text-muted-foreground">{role.permissions.length} permission{role.permissions.length > 1 ? "s" : ""}</span>
            </button>
            {isOwner && (
              <span className="flex shrink-0 items-center">
                <button type="button" aria-label={`Monter ${role.name}`} title="Monter" disabled={sorted[0].id === role.id || movingId !== null} onClick={() => handleMove(role, -1)} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" aria-label={`Descendre ${role.name}`} title="Descendre" disabled={sorted[sorted.length - 1].id === role.id || movingId !== null} onClick={() => handleMove(role, 1)} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>
            )}
          </li>
        ))}
        {sorted.length === 0 && <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Aucun rôle pour l’instant.</p>}
      </ul>
    </div>
  );
}

function RoleEditor({ server, role, isOwner, onBack, onSaved, onDelete }: { server: Server; role: Role; isOwner: boolean; onBack: () => void; onSaved: (role: Role) => void; onDelete: () => void }) {
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() !== role.name || color !== role.color || permissions.length !== role.permissions.length || permissions.some(p => !role.permissions.includes(p));

  function togglePermission(key: string) {
    setPermissions(prev => (prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty)
      return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateRole(server.id, role.id, {
        name: name.trim() !== role.name ? name.trim() : undefined,
        color: color !== role.color ? color : undefined,
        permissions,
      });
      onSaved(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le rôle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Tous les rôles
      </button>

      <h1 className="text-xl font-bold">Modifier le rôle</h1>

      <label className="mt-6 block text-sm">Nom du rôle
        <input value={name} onChange={e => setName(e.target.value)} required minLength={1} disabled={!isOwner || role.is_default} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring disabled:opacity-60" />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm">Couleur du rôle
        <input type="color" value={color} onChange={e => setColor(e.target.value)} disabled={!isOwner || role.is_default} className="h-9 w-14 cursor-pointer rounded border border-input bg-card p-1 disabled:opacity-60" />
        <span className="font-mono text-xs text-muted-foreground">{color}</span>
      </label>

      <div className="mt-6">
        <p className="text-sm font-semibold">Permissions</p>
        <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
          {PERMISSIONS.map(perm => (
            <label key={perm.key} className="flex items-start gap-3 px-4 py-3 text-sm">
              <input type="checkbox" checked={permissions.includes(perm.key)} onChange={() => togglePermission(perm.key)} disabled={!isOwner} className="mt-0.5 h-4 w-4 rounded border-input" />
              <span>
                <span className="block font-medium">{perm.label}</span>
                <span className="block text-xs text-muted-foreground">{perm.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && !error && <p className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"><Check className="h-4 w-4" /> Rôle mis à jour.</p>}

      {isOwner && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {!role.is_default && <button type="button" onClick={onDelete} className="flex h-10 items-center gap-1.5 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" /> Supprimer ce rôle
          </button>}
          <button type="submit" disabled={!dirty || busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      )}
    </form>
  );
}

function DangerTab({ server, onServerDeleted }: { server: Server; onServerDeleted: () => void }) {
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canDelete = confirmName === server.name;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canDelete)
      return;
    setBusy(true);
    setError("");
    try {
      await deleteServer(server.id);
      onServerDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le serveur");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-bold text-destructive">Zone de danger</h1>
      <p className="mt-1 text-sm text-muted-foreground">La suppression du serveur est définitive : salons, messages, rôles et membres seront perdus.</p>

      <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <label className="block text-sm">
          Tape « <span className="font-semibold">{server.name}</span> » pour confirmer
          <input value={confirmName} onChange={e => setConfirmName(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />
        </label>

        {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={!canDelete || busy} className="h-10 rounded-md bg-destructive px-5 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? "Suppression…" : "Supprimer le serveur"}
          </button>
        </div>
      </div>
    </form>
  );
}
