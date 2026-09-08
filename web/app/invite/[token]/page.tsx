/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Invitation page
*/

import InviteAcceptance from "../../../components/invite-acceptance";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    return <InviteAcceptance token={token} />;
}
