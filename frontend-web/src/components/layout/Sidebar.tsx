"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ArrowUpDown, ArrowLeftRight, Wallet,
  Upload, Tag, Target, CalendarDays, BarChart3,
  Sparkles, Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={15} /> },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Transações", href: "/transacoes", icon: <ArrowUpDown size={15} /> },
      { label: "Transferências", href: "/transferencias", icon: <ArrowLeftRight size={15} /> },
      { label: "Carteiras", href: "/carteiras", icon: <Wallet size={15} /> },
      { label: "Importar", href: "/importar", icon: <Upload size={15} />, badge: "Novo" },
      { label: "Categorias", href: "/categorias", icon: <Tag size={15} /> },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { label: "Orçamentos", href: "/orcamentos", icon: <Target size={15} /> },
      { label: "Metas", href: "/metas", icon: <Target size={15} />, badge: "Novo" },
      { label: "Agenda", href: "/agenda", icon: <CalendarDays size={15} /> },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Relatórios", href: "/relatorios", icon: <BarChart3 size={15} /> },
      { label: "Insights IA", href: "/insights", icon: <Sparkles size={15} />, badge: "IA" },
    ],
  },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName = "Usuário", userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = userName.charAt(0).toUpperCase();

  return (
    <aside className="w-[220px] min-h-screen bg-sidebar border-r border-border-subtle flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          F
        </div>
        <div>
          <p className="text-sm font-black text-text">Finança</p>
          <p className="text-[9px] uppercase tracking-[2px] text-muted">Pessoal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-3">
            <p className="text-[9px] uppercase tracking-[2px] font-semibold text-[#3f3f46] px-2 mb-1.5 mt-3">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 transition-colors ${
                    isActive
                      ? "bg-[#1c1c22] text-text font-semibold border-l-2 border-accent pl-2"
                      : "text-subtle hover:bg-card-hover hover:text-text"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badge === "IA"
                        ? "bg-[#8b5cf620] text-[#a78bfa]"
                        : "bg-[#a3e63515] text-income"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-card-hover transition-colors">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text truncate">{userName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Link href="/configuracoes" className="text-[10px] text-muted hover:text-accent transition-colors">
                Perfil
              </Link>
              <span className="text-[#3f3f46] text-[10px]">·</span>
              <button
                onClick={handleLogout}
                className="text-[10px] text-muted hover:text-danger transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
          <Link href="/configuracoes" className="w-6 h-6 rounded-md bg-card flex items-center justify-center text-muted hover:text-accent transition-colors flex-shrink-0">
            <Settings size={12} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
