import { cookies } from "next/headers";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export async function AppLayout({ children }: AppLayoutProps) {
  // Fetch user info server-side
  let userName = "Usuário";
  let userEmail: string | undefined;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      // Import inline to avoid circular dependency
      const { verifyJwt } = await import("@/lib/auth");
      const payload = verifyJwt<{ sub: number }>(token);
      if (payload?.sub) {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { name: true, email: true },
        });
        if (user) {
          userName = user.name;
          userEmail = user.email;
        }
      }
    }
  } catch {
    // fallback to defaults
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
