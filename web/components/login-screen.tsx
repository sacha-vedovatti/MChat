/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Login screen component
*/

"use client";
import { FormEvent, useState } from "react";
import { login, register } from "../lib/api/auth";
import type { User } from "../lib/types";

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (registerMode) {
        await register(email, username, password)
      } else {
        await login(email, password)
      }
      const { getMe } = await import("../lib/api/auth");
      onAuthenticated(await getMe());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setBusy(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-card p-7 shadow-2xl"><div className="mb-7"><p className="text-sm font-semibold text-primary">MCHAT</p><h1 className="mt-2 text-2xl font-bold">{registerMode ? "Créer un compte" : "Bon retour"}</h1><p className="mt-1 text-sm text-muted-foreground">{registerMode ? "Rejoins une communauté et commence à discuter." : "Connecte-toi pour accéder à tes serveurs."}</p></div>{registerMode && <label className="mb-4 block text-sm">Nom d’utilisateur<input value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label>}<label className="mb-4 block text-sm">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label><label className="mb-4 block text-sm">Mot de passe<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label>{error && <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button disabled={busy} className="h-10 w-full rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Chargement…" : registerMode ? "Créer mon compte" : "Se connecter"}</button><button type="button" onClick={() => { setRegisterMode(v => !v); setError("") }} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">{registerMode ? "J’ai déjà un compte" : "Créer un compte"}</button></form></main>
}
