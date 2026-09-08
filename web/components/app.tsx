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
import { getChannels, getServers, createChannel, createServer } from "../lib/api/servers";
import { deleteMessage, getMessages, sendMessage } from "../lib/api/messages";
import { banMember, getMembers, kickMember } from "@/lib/api/members";
import type { Channel, Member, Message, Role, Server } from "../lib/types";
import { LoginScreen } from "./login-screen";
import { ServerRail } from "./server-rail";
import { ChannelSidebar } from "./channel-sidebar";
import { ChatView } from "./chat-view";
import { MemberSidebar } from "./member-sidebar";
import { UserSettingsModal } from "./user-settings";
import { ServerSettingsModal } from "./server-settings";
import { ChannelEditModal } from "./channel-settings";
import { UserProfileModal } from "./user-profile-modal";
import { MemberContextMenu } from "./member-context-menu";

export function App() {
    const auth = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [profileMember, setProfileMember] = useState<Member | null>(null);
    const [contextMenu, setContextMenu] = useState<{ member: Member; x: number; y: number } | null>(null);
    const [servers, setServers] = useState<Server[]>([]);
    const [activeServerId, setActiveServerId] = useState<string | null>(null);
    const [channels, setChannels] = useState<Record<string, Channel[]>>({});
    const [members, setMembers] = useState<Record<string, Member[]>>({});
    const [roles, setRoles] = useState<Record<string, Role[]>>({});
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [activeChannelByServer, setActiveChannelByServer] = useState<Record<string, string>>({});
    const [membersShown, setMembersShown] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const activeServer = useMemo(() => servers.find(s => s.id === activeServerId) ?? null, [servers, activeServerId]);
    const activeChannelId = activeServerId ? activeChannelByServer[activeServerId] : undefined;
    const activeChannel = activeServer && activeChannelId ? channels[activeServer.id]?.find(c => c.id === activeChannelId) : undefined;
    const currentMember = activeServer ? (members[activeServer.id] ?? []).find(m => m.user.id === auth.user?.id) ?? null : null;

    useEffect(() => {
        if (!auth.user)
            return;
        setLoading(true);
        setError("");
        getServers().then(async data => {
            const list = data.map(({ channels: _, users: __, roles: ___, ...s }) => s);
            setServers(list);
            setRoles(Object.fromEntries(data.map(s => [s.id, s.roles])));
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

    function handleServerUpdated(updated: Server) {
        setServers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    }

    function handleServerDeleted() {
        if (!activeServer)
            return;
        const deletedId = activeServer.id;
        setServerSettingsOpen(false);
        setServers(prev => prev.filter(s => s.id !== deletedId));
        setActiveServerId(prev => (prev === deletedId ? null : prev));
    }

    function handleRolesChanged(serverId: string, next: Role[]) {
        setRoles(prev => ({ ...prev, [serverId]: next }));
    }

    function handleChannelUpdated(updated: Channel) {
        setChannels(prev => ({ ...prev, [updated.server_id]: (prev[updated.server_id] ?? []).map(c => (c.id === updated.id ? updated : c)) }));
        setEditingChannel(updated);
    }

    function handleChannelDeleted(channelId: string) {
        if (!activeServer)
            return;
        setEditingChannel(null);
        setChannels(prev => {
            const remaining = (prev[activeServer.id] ?? []).filter(c => c.id !== channelId);
            return { ...prev, [activeServer.id]: remaining };
        });
        setActiveChannelByServer(prev => (prev[activeServer.id] === channelId ? { ...prev, [activeServer.id]: "" } : prev));
    }

    function handleMemberRoleAssigned(updated: Member) {
        if (!activeServer)
            return;
        setMembers(prev => ({ ...prev, [activeServer.id]: (prev[activeServer.id] ?? []).map(m => (m.user.id === updated.user.id ? updated : m)) }));
    }

    async function handleKickMember(userId: string) {
        if (!activeServer)
            return;
        await kickMember(activeServer.id, userId);
        setMembers(prev => ({ ...prev, [activeServer.id]: (prev[activeServer.id] ?? []).filter(m => m.user.id !== userId) }));
    }

    async function handleBanMember(userId: string) {
        if (!activeServer)
            return;
        await banMember(activeServer.id, userId);
        setMembers(prev => ({ ...prev, [activeServer.id]: (prev[activeServer.id] ?? []).filter(m => m.user.id !== userId) }));
    }

    if (auth.loading)
        return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Chargement…</div>
    if (!auth.user)
        return <LoginScreen onAuthenticated={auth.setUser} />
    if (loading && servers.length === 0)
        return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Chargement de MChat…</div>
    if (error && servers.length === 0)
        return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6"><h1 className="font-semibold">Impossible de charger MChat</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => location.reload()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Réessayer</button></div></div>
    return <div className="flex h-screen w-full overflow-hidden text-foreground">
        <ServerRail servers={servers} activeServerId={activeServerId} onSelect={setActiveServerId} onCreate={handleCreateServer} onLogout={auth.logout} />
        {activeServer ? <>
            <ChannelSidebar
                server={activeServer}
                user={auth.user}
                channels={channels[activeServer.id] ?? []}
                activeChannelId={activeChannel?.id ?? null}
                isOwner={activeServer.owner_id === auth.user.id}
                onSelect={id => setActiveChannelByServer(prev => ({ ...prev, [activeServer.id]: id }))}
                onCreateChannel={handleCreateChannel}
                onEditChannel={setEditingChannel}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenServerSettings={() => setServerSettingsOpen(true)}
            />
            {activeChannel ? <>
                <ChatView channel={activeChannel} messages={messages[activeChannel.id] ?? []} members={members[activeServer.id] ?? []} currentUser={auth.user} onSend={handleSend} onDelete={handleDelete} onToggleMembers={() => setMembersShown(v => !v)} membersShown={membersShown} onOpenProfile={setProfileMember} onOpenContextMenu={(member, x, y) => setContextMenu({ member, x, y })} />
                {membersShown && <MemberSidebar members={members[activeServer.id] ?? []} onOpenProfile={setProfileMember} onOpenContextMenu={(member, x, y) => setContextMenu({ member, x, y })} />}
            </> : <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary"><Plus className="h-8 w-8" /></div>
                <h2 className="text-xl font-semibold">Aucun salon</h2>
                <p className="max-w-sm text-sm text-muted-foreground">Ce serveur n’a pas encore de salon. Crée-en un depuis la sidebar pour commencer à discuter.</p>
                <button onClick={handleCreateChannel} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Créer un salon</button>
            </div>}
        </> : <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary"><Plus className="h-8 w-8" /></div>
            <h2 className="text-xl font-semibold">Aucun serveur</h2>
            <p className="max-w-sm text-sm text-muted-foreground">Crée un serveur pour commencer à discuter.</p>
        </div>}
        {settingsOpen && <UserSettingsModal user={auth.user} onClose={() => setSettingsOpen(false)} onUpdated={auth.setUser} onLogout={auth.logout} />}
        {serverSettingsOpen && activeServer && <ServerSettingsModal server={activeServer} roles={roles[activeServer.id] ?? []} isOwner={activeServer.owner_id === auth.user.id} onClose={() => setServerSettingsOpen(false)} onServerUpdated={handleServerUpdated} onServerDeleted={handleServerDeleted} onRolesChanged={next => handleRolesChanged(activeServer.id, next)} />}
        {editingChannel && <ChannelEditModal channel={editingChannel} onClose={() => setEditingChannel(null)} onUpdated={handleChannelUpdated} onDeleted={handleChannelDeleted} />}
        {profileMember && <UserProfileModal member={profileMember} currentUser={auth.user} onClose={() => setProfileMember(null)} onEditProfile={profileMember.user.id === auth.user.id ? () => { setProfileMember(null); setSettingsOpen(true); } : undefined} />}
        {contextMenu && activeServer && <MemberContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            member={contextMenu.member}
            server={activeServer}
            roles={roles[activeServer.id] ?? []}
            currentUser={auth.user}
            currentUserRole={currentMember?.role ?? null}
            isOwner={activeServer.owner_id === auth.user.id}
            onClose={() => setContextMenu(null)}
            onOpenProfile={member => { setContextMenu(null); setProfileMember(member); }}
            onRoleAssigned={handleMemberRoleAssigned}
            onKicked={handleKickMember}
            onBanned={handleBanMember}
        />}
    </div>
}
