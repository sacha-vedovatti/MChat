/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Authentication manager hook
*/

"use client";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "../lib/api/client";
import { getMe } from "../lib/api/auth";
import type { User } from "../lib/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getMe().then(setUser).catch(() => {
      clearToken();
      setUser(null);
    }).finally(() => setLoading(false));
  }, [])

  return {
    user, loading, setUser, logout: () => {
      clearToken();
      setUser(null);
    }
  }
}
