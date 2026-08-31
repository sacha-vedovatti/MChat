/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Application components
*/

"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { getChannels, getMembers, getServers, createChannel, createServer } from "../lib/api/servers";
import { deleteMessage, getMessages, sendMessage } from "../lib/api/messages";
import type { Channel, Member, Message, Server } from "../lib/types";
import { LoginScreen } from "./login-screen";
import { ServerRail } from "./server-rail";
import { ChannelSidebar } from "./channel-sidebar";
import { ChatView } from "./chat-view";
import { MemberSidebar } from "./member-sidebar";
import { UserSettingsModal } from "./user-settings";

export function App() {
    const auth = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);
    const [activeServerId, setActiveServerId] = useState<string | null>(null);
    const [channels, setChannels] = useState<Record<string, Channel[]>>({});
    const [members, setMembers] = useState<Record<string, Member[]>>({});
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [activeChannelByServer, setActiveChannelByServer] = useState<Record<string, string>>({});
    const [membersShown, setMembersShown] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const activeServer = useMemo(() => servers.find(s => s.id === activeServerId) ?? null, [servers, activeServerId]);
    const activeChannelId = activeServerId ? activeChannelByServer[activeServerId] : undefined;
    const activeChannel = activeServer && activeChannelId ? channels[activeServer.id]?.find(c => c.id === activeChannelId) : undefined;

    useEffect(() => {
        if (!auth.user)
            return;
        setLoading(true);
        setError("");
        getServers().then(async data => {
            const list = data.map(({ channels: _, users: __, roles: ___, ...s }) => s);
            setServers(list);
            if (list[0])
                setActiveServerId(prev => prev ?? list[0].id);
            for (const s of list) {
                const [chs, mems] = await Promise.all([getChannels(s.id), getMembers(s.id)]);
                setChannels(prev => ({ ...prev, [s.id]: chs }));
                setMembers(prev => ({ ...prev, [s.id]: mems }));
                setActiveChannelByServer(prev => ({ ...prev, [s.id]: prev[s.id] ?? chs[0]?.id ?? "" }));
            }
        }).catch(e => setError(e instanceof Error ? e.message : "Impossible de charger les serveurs")).finally(() => setLoading(false))
    }, [auth.user]);

    useEffect(() => {
        if (!activeChannelId)
            return;
        getMessages(activeChannelId).then(p => setMessages(prev => ({ ...prev, [activeChannelId]: [...p.items].reverse() }))).catch(e => setError(e instanceof Error ? e.message : "Impossible de charger les messages"))
    }, [activeChannelId]);

    async function handleSend(content: string) {
        if (!activeChannelId)
            return;

        const message = await sendMessage(activeChannelId, content);
        setMessages(prev => ({ ...prev, [activeChannelId]: [...(prev[activeChannelId] ?? []), message] }));
    }

    async function handleDelete(id: string) {
        await deleteMessage(id);
        setMessages(prev => ({ ...prev, [activeChannelId!]: prev[activeChannelId!].filter(m => m.id !== id) }));
    }

    async function handleCreateServer() {
        const name = window.prompt("Nom du serveur");
        if (!name?.trim())
            return;

        const server = await createServer(name.trim());
        setServers(prev => [...prev, server]);
        setActiveServerId(server.id);

        const chs = await getChannels(server.id);
        setChannels(prev => ({ ...prev, [server.id]: chs }));
        setMembers(prev => ({ ...prev, [server.id]: [] }));
        setActiveChannelByServer(prev => ({ ...prev, [server.id]: chs[0]?.id ?? "" }));
    }

    async function handleCreateChannel() {
        if (!activeServer)
            return;

        const name = window.prompt("Nom du salon");
        if (!name?.trim())
            return;

        const ch = await createChannel(activeServer.id, name.trim());
        setChannels(prev => ({ ...prev, [activeServer.id]: [...(prev[activeServer.id] ?? []), ch] }));
        setActiveChannelByServer(prev => ({ ...prev, [activeServer.id]: ch.id }));
    }

    if (auth.loading)
        return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Chargement…</div>
    if (!auth.user)
        return <LoginScreen onAuthenticated={auth.setUser} />
    if (loading && servers.length === 0)
        return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Chargement de MChat…</div>
    if (error && servers.length === 0)
        return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6"><h1 className="font-semibold">Impossible de charger MChat</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => location.reload()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Réessayer</button></div></div>
    return <div className="flex h-screen w-full overflow-hidden text-foreground"><ServerRail servers={servers} activeServerId={activeServerId} onSelect={setActiveServerId} onCreate={handleCreateServer} onLogout={auth.logout} />{activeServer && activeChannel ? <><ChannelSidebar server={activeServer} user={auth.user} channels={channels[activeServer.id] ?? []} activeChannelId={activeChannel.id} onSelect={id => setActiveChannelByServer(prev => ({ ...prev, [activeServer.id]: id }))} onCreateChannel={handleCreateChannel} onOpenSettings={() => setSettingsOpen(true)} /><ChatView channel={activeChannel} messages={messages[activeChannel.id] ?? []} members={members[activeServer.id] ?? []} currentUser={auth.user} onSend={handleSend} onDelete={handleDelete} onToggleMembers={() => setMembersShown(v => !v)} membersShown={membersShown} />{membersShown && <MemberSidebar members={members[activeServer.id] ?? []} />}</> : <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary"><Plus className="h-8 w-8" /></div><h2 className="text-xl font-semibold">{servers.length ? "Aucun salon" : "Aucun serveur"}</h2><p className="max-w-sm text-sm text-muted-foreground">Crée un serveur ou un salon pour commencer à discuter.</p></div>}{settingsOpen && <UserSettingsModal user={auth.user} onClose={() => setSettingsOpen(false)} onUpdated={auth.setUser} onLogout={auth.logout} />}</div>
}
