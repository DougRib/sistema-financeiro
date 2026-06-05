"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";

interface MobileTopbarProps {
  userName: string;
  userEmail?: string;
}

export function MobileTopbar({ userName, userEmail }: MobileTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="lg:hidden sticky top-0 z-30 sidebar border-b border-border-subtle safe-top">
      <div className="h-14 flex items-center justify-between px-4 safe-x">
        <Link href="/dashboard" className="flex items-center gap-2 touch-target">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e6c879] to-[#b8893f] flex items-center justify-center shadow-md shadow-accent/20">
            <Image
              src="/fc-icon.png"
              alt="Logo"
              width={20}
              height={20}
              className="h-4"
              style={{ width: "auto" }}
            />
          </div>
          <div className="flex items-baseline gap-0">
            <span className="text-sm font-black text-text tracking-tight">Finança</span>
            <span className="text-sm font-black text-gold-gradient tracking-tight">Flow</span>
          </div>
        </Link>

        <div ref={ref} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="touch-target w-11 h-11 rounded-full bg-gradient-to-br from-[#e6c879] to-[#b8893f] text-[#1a1208] text-sm font-bold shadow-md cursor-pointer"
            aria-label="Menu do usuário"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-pop z-50">
              <div className="px-3 py-3 border-b border-border-subtle">
                <p className="text-xs font-semibold text-text truncate">{userName}</p>
                {userEmail && (
                  <p className="text-[10px] text-muted truncate mt-0.5">{userEmail}</p>
                )}
              </div>

              <Link
                href="/configuracoes"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 text-xs text-text hover:bg-card-hover hover:text-accent transition-colors cursor-pointer touch-target"
              >
                <User size={14} />
                <span>Perfil & Configurações</span>
              </Link>

              <div className="h-px bg-border-subtle" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-3 text-xs text-text hover:bg-expense/10 hover:text-expense transition-colors cursor-pointer touch-target"
              >
                <LogOut size={14} />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
