/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server invitation modal
*/

"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Link, X } from "lucide-react";
import { createInvitation } from "../lib/api/servers";
import type { Server } from "../lib/types";

export function InviteModal({ server, onClose }: { server: Server; onClose: () => void }) {
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        const generateInvite = async () => {
            try {
                const invitation = await createInvitation(server.id, 24 * 60 * 60);
                setInviteLink(`${window.location.origin}${invitation.invite_path}`);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Impossible de créer le lien d’invitation");
            } finally {
                setBusy(false);
            }
        };
        void generateInvite();
    }, [server.id]);

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape")
                onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function copyInvite() {
        if (!inviteLink)
            return;
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
    }

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Link className="h-5 w-5 text-primary" />
                        <h2 id="invite-title" className="text-lg font-semibold">Inviter sur {server.name}</h2>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Ce lien sera valable pendant 24 heures.</p>
                </div>
                <button onClick={onClose} aria-label="Fermer" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {busy && <p className="mt-6 text-sm text-muted-foreground">Génération du lien…</p>}
            {error && <p className="mt-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {inviteLink && <div className="mt-6 flex gap-2">
                <input readOnly value={inviteLink} aria-label="Lien d’invitation" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none" />
                <button type="button" onClick={copyInvite} aria-label="Copier le lien" title="Copier le lien" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-accent">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copié" : "Copier"}
                </button>
            </div>}
        </div>
    </div>;
}
