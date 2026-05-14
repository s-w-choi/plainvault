import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/action-auth";
import { getUserById } from "@/lib/users/user-service";
import { UserProvider, type UserInfo } from "@/components/providers/user-provider";

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}): UserInfo {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }

  const dbUser = await getUserById(session.userId);
  if (!dbUser) {
    redirect("/login");
  }

  const user = serializeUser(dbUser);

  return (
    <UserProvider user={user}>{children}</UserProvider>
  );
}
