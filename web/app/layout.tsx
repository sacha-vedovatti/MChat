/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Layout
*/

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "MChat",
    description: "Plateforme de messagerie MChat"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="fr"><body>{children}</body></html>;
}
