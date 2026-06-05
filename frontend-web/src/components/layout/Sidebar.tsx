"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowUpDown,
  ArrowLeftRight,
  Wallet,
  Upload,
  Tag,
  Target,
  CalendarDays,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { UserMenu } from "@/components/ui/UserMenu";

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
      { label: "Importar", href: "/importar", icon: <Upload size={15} /> },
      { label: "Categorias", href: "/categorias", icon: <Tag size={15} /> },
    ],
  },
  {
    title: "Planejamento",
    items: [
      { label: "Orçamentos", href: "/orcamentos", icon: <Target size={15} /> },
      { label: "Metas", href: "/metas", icon: <Target size={15} /> },
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

  return (
    <aside className="w-[240px] min-h-screen sidebar border-r border-border-subtle flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e6c879] to-[#b8893f] flex items-center justify-center shadow-lg shadow-accent/20">
          <Image
            src="/fc-icon.png"
            alt="Logo"
            width={24}
            height={24}
            className="h-5"
            style={{ width: "auto" }}
          />
        </div>
        <div className="flex items-baseline gap-0">
          <span className="text-[15px] font-black text-text tracking-tight">Finança</span>
          <span className="text-[15px] font-black text-gold-gradient tracking-tight">Flow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="text-[9px] uppercase tracking-[2.5px] font-bold text-muted px-3 mb-2 mt-3">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] mb-1 ${
                    isActive ? "nav-item-active" : ""
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && !isActive && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badge === "IA"
                          ? "bg-accent/15 text-accent"
                          : "bg-income/15 text-income"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User menu */}
      <div className="border-t border-border-subtle p-3">
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </aside>
  );
}
