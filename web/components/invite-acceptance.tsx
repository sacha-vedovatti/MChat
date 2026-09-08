/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Invitation Acceptance component
*/

"use client";

import { useEffect, useState } from "react";
import { acceptInvitation } from "../lib/api/servers";
import { getMe } from "../lib/api/auth";
import { getToken } from "../lib/api/client";
import { LoginScreen } from "./login-screen";
import type { User } from "../lib/types";

export default function InviteAcceptance({ token }: { token: string }) {
    const [user, setUser] = useState<User | null>(null);
    const [started, setStarted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [joined, setJoined] = useState("");
    const [authRequired, setAuthRequired] = useState(!getToken());

    async function join(currentUser?: User) {
        setStarted(true);
        setBusy(true);
        setError("");
        try {
            const server = await acceptInvitation(token);
            setUser(currentUser ?? user);
            setJoined(server.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d’accepter l’invitation");
        } finally {
            setBusy(false);
        }
    }

    async function handleAuthenticated(authenticatedUser: User) {
        setAuthRequired(false);
        setUser(authenticatedUser);
        await join(authenticatedUser);
    }

    useEffect(() => {
        if (authRequired || started)
            return;
        getMe().then(authenticatedUser => {
            setUser(authenticatedUser);
            void join(authenticatedUser);
        }).catch(() => setAuthRequired(true));
    }, [authRequired, started]);

    if (authRequired && !user)
        return <LoginScreen onAuthenticated={handleAuthenticated} />;

    if (joined)
        return <main className="flex min-h-screen items-center justify-center bg-background p-6"><section className="w-full max-w-md rounded-xl border border-border bg-card p-7 text-center"><h1 className="text-2xl font-bold">Invitation acceptée</h1><p className="mt-2 text-sm text-muted-foreground">Tu as rejoint « {joined} ».</p><button onClick={() => { window.location.href = "/"; }} className="mt-6 h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Ouvrir MChat</button></section></main>;

    return <main className="flex min-h-screen items-center justify-center bg-background p-6"><section className="w-full max-w-md rounded-xl border border-border bg-card p-7"><h1 className="text-2xl font-bold">Rejoindre un serveur</h1><p className="mt-2 text-sm text-muted-foreground">Ce lien d’invitation est prêt à être utilisé.</p>{error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button onClick={() => void join()} disabled={busy} className="mt-6 h-10 w-full rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Connexion…" : "Réessayer"}</button></section></main>;
}
