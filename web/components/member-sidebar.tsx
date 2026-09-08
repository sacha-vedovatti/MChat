/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Siderbar component
*/

import type { Member } from "../lib/types";
import { UserAvatar } from "./user-avatar";

export function MemberSidebar({ members, onOpenProfile, onOpenContextMenu }: { members: Member[]; onOpenProfile: (member: Member) => void; onOpenContextMenu: (member: Member, x: number, y: number) => void }) {
    const groups = new Map<string, { name: string; color: string; members: Member[] }>();
    const offline: Member[] = [];

    for (const m of members) {
        const role = m.role;
        if (!role) {
            offline.push(m);
            continue;
        }

        const g = groups.get(role.id.toString()) ?? { name: role.name, color: role.color, members: [] };
        g.members.push(m);
        groups.set(role.id.toString(), g);
    }

    function memberRow(m: Member) {
        return <div key={m.user.id} onClick={() => onOpenProfile(m)} onContextMenu={e => { e.preventDefault(); onOpenContextMenu(m, e.clientX, e.clientY); }} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/60"><UserAvatar user={m.user} size={32} /><span className="truncate text-sm" style={{ color: m.role?.color }}>{m.user.username}</span></div>
    }

    return <aside className="hidden w-60 shrink-0 overflow-y-auto bg-sidebar px-3 py-4 lg:block">{Array.from(groups.values()).map(g => <div key={g.name} className="mb-5"><h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.name} — {g.members.length}</h3>{g.members.map(memberRow)}</div>)}{offline.length > 0 && <div><h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Autres — {offline.length}</h3>{offline.map(m => <div key={m.user.id} onClick={() => onOpenProfile(m)} onContextMenu={e => { e.preventDefault(); onOpenContextMenu(m, e.clientX, e.clientY); }} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 opacity-70 hover:bg-sidebar-accent/60 hover:opacity-100"><UserAvatar user={m.user} size={32} /><span className="truncate text-sm">{m.user.username}</span></div>)}</div>}</aside>
}
