"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

const UserContext = createContext<UserInfo | null>(null);

export function UserProvider({ user, children }: { user: UserInfo | null; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
