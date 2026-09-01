/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Channel edit modal component
*/

"use client";
import { FormEvent, useEffect, useState } from "react";
import { X, Trash2, Check } from "lucide-react";
import { deleteChannel, updateChannel } from "../lib/api/servers";
import type { Channel } from "../lib/types";

export function ChannelEditModal({
  channel,
  onClose,
  onUpdated,
  onDeleted,
}: {
  channel: Channel;
  onClose: () => void;
  onUpdated: (channel: Channel) => void;
  onDeleted: (channelId: string) => void;
}) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() !== channel.name || description.trim() !== (channel.description ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")
        onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty)
      return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateChannel(channel.id, {
        name: name.trim() !== channel.name ? name.trim() : undefined,
        description: description.trim() !== (channel.description ?? "") ? (description.trim() || undefined) : undefined,
      });
      onUpdated(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le salon");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteChannel(channel.id);
      onDeleted(channel.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le salon");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-bold">Modifier le salon</h1>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block text-sm">Nom du salon
          <div className="mt-1 flex items-center gap-1 rounded-md border border-input bg-card px-3">
            <span className="text-muted-foreground">#</span>
            <input value={name} onChange={e => setName(e.target.value)} required minLength={1} className="h-10 w-full bg-transparent outline-none" />
          </div>
        </label>

        <label className="mt-4 block text-sm">Description
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Décris ce salon (optionnel)" className="mt-1 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>

        {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {success && !error && <p className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"><Check className="h-4 w-4" /> Salon mis à jour.</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={handleDelete} disabled={busy} className={`flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold disabled:opacity-40 ${confirmingDelete ? "border-destructive bg-destructive text-white" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}>
            <Trash2 className="h-4 w-4" /> {confirmingDelete ? "Confirmer la suppression" : "Supprimer"}
          </button>
          <button type="submit" disabled={!dirty || busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}
