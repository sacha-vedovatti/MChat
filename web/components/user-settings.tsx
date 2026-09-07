/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User settings modal component
*/

"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { X, User as UserIcon, KeyRound, ShieldAlert, LogOut, Check, Camera, Loader2 } from "lucide-react";
import { deleteAccount, updateProfile } from "../lib/api/auth";
import { clearToken } from "../lib/api/client";
import type { User } from "../lib/types";
import { UserAvatar } from "./user-avatar";

const MAX_AVATAR_SOURCE_BYTES = 8 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 256;

function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier sélectionné n'est pas une image."));
      return;
    }
    if (file.size > MAX_AVATAR_SOURCE_BYTES) {
      reject(new Error("L'image est trop lourde (8 Mo maximum)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Impossible de charger cette image."));
      img.onload = () => {
        const scale = Math.min(1, AVATAR_MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Le navigateur ne permet pas de traiter cette image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Tab = "profile" | "password" | "danger";

export function UserSettingsModal({ user, onClose, onUpdated, onLogout }: { user: User; onClose: () => void; onUpdated: (user: User) => void; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("profile");

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
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mon compte</p>
          <nav className="space-y-0.5">
            {navItem("profile", "Mon profil", <UserIcon className="h-4 w-4" />)}
            {navItem("password", "Mot de passe", <KeyRound className="h-4 w-4" />)}
            {navItem("danger", "Zone de danger", <ShieldAlert className="h-4 w-4" />, true)}
          </nav>
          <div className="my-3 h-px bg-border" />
          <button onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto bg-background px-6 py-10 sm:px-12">
          <button onClick={onClose} aria-label="Fermer" className="absolute right-6 top-8 rounded-full border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto max-w-xl">
            {tab === "profile" && <ProfileTab user={user} onUpdated={onUpdated} />}
            {tab === "password" && <PasswordTab />}
            {tab === "danger" && <DangerTab onLogout={onLogout} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, onUpdated }: { user: User; onUpdated: (user: User) => void }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [showUrlField, setShowUrlField] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirty = username !== user.username || email !== user.email || avatarUrl !== (user.avatar_url ?? "");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file)
      return;

    setAvatarError("");
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Impossible de traiter cette image.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!dirty)
      return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateProfile({
        username: username !== user.username ? username : undefined,
        email: email !== user.email ? email : undefined,
        avatar_url: avatarUrl !== (user.avatar_url ?? "") ? (avatarUrl.trim() || null) : undefined,
      });
      onUpdated(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le profil");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-bold">Mon profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Modifie tes informations publiques.</p>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarBusy}
          aria-label="Changer la photo de profil"
          className="group relative shrink-0 overflow-hidden rounded-full disabled:opacity-70"
        >
          <UserAvatar user={{ username, avatar_url: avatarUrl || null }} size={72} />
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {avatarBusy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
          </span>
        </button>
        <div className="flex-1">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <p className="text-sm font-medium">Photo de profil</p>
          <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG, GIF ou WebP. Redimensionnée automatiquement.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarBusy} className="h-8 rounded-md border border-input bg-card px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50">
              {avatarBusy ? "Traitement…" : "Choisir une image"}
            </button>
            {avatarUrl && <button type="button" onClick={() => setAvatarUrl("")} className="text-xs text-muted-foreground hover:text-destructive">Retirer</button>}
            <button type="button" onClick={() => setShowUrlField(v => !v)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {showUrlField ? "Masquer le lien" : "Utiliser un lien à la place"}
            </button>
          </div>
          {showUrlField && <input value={avatarUrl.startsWith("data:") ? "" : avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />}
          {avatarError && <p className="mt-2 text-xs text-destructive">{avatarError}</p>}
        </div>
      </div>

      <label className="mt-5 block text-sm">Nom d'utilisateur
        <input value={username} onChange={e => setUsername(e.target.value)} required minLength={2} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label className="mt-4 block text-sm">E-mail
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />
      </label>

      {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && !error && <p className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"><Check className="h-4 w-4" /> Profil mis à jour.</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button type="submit" disabled={!dirty || busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}

function PasswordTab() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setBusy(true);

    try {
      await updateProfile({password: newPassword});
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de changer le mot de passe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-bold">Mot de passe</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choisis un nouveau mot de passe pour sécuriser ton compte.</p>

      <label className="mt-4 block text-sm">Nouveau mot de passe
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />
      </label>

      <label className="mt-4 block text-sm">Confirmer le nouveau mot de passe
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus:ring-2 focus:ring-ring" />
      </label>

      {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && !error && <p className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"><Check className="h-4 w-4" /> Mot de passe mis à jour.</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button type="submit" disabled={busy} className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{busy ? "Enregistrement…" : "Changer le mot de passe"}</button>
      </div>
    </form>
  );
}

function DangerTab({ onLogout }: { onLogout: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteAccount();
      clearToken();
      onLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le compte");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="text-xl font-bold text-destructive">Zone de danger</h1>
      <p className="mt-1 text-sm text-muted-foreground">La suppression de ton compte est définitive et irréversible.</p>

      <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        {error && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={busy} className="h-10 rounded-md bg-destructive px-5 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? "Suppression…" : confirming ? "Confirmer la suppression" : "Supprimer mon compte"}
          </button>
        </div>
        {confirming && !busy && <p className="mt-2 text-right text-xs text-destructive">Clique à nouveau pour confirmer.</p>}
      </div>
    </form>
  );
}
