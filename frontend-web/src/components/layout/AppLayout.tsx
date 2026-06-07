import { cookies } from "next/headers";
import { Sidebar } from "./Sidebar";
import { MobileTopbar } from "./MobileTopbar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export async function AppLayout({ children }: AppLayoutProps) {
  let userName = "Usuário";
  let userEmail: string | undefined;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
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
    <div className="flex h-screen bg-sidebar overflow-hidden">
      {/* Desktop sidebar — fixed, never scrolls with content */}
      <div className="hidden lg:flex flex-shrink-0 sticky top-0 h-screen">
        <Sidebar userName={userName} userEmail={userEmail} />
      </div>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Mobile topbar — replaces desktop sidebar at <lg */}
        <MobileTopbar userName={userName} userEmail={userEmail} />

        {/* Page content — scrollable region; reserves room above bottom-nav on mobile */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden pb-bottom-nav lg:pb-0">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
