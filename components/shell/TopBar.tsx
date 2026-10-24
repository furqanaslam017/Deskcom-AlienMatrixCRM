"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/hooks/i18n/useT";
import { cn } from "@/lib/utils";
import { AlertsBell } from "./AlertsBell";
import { AvisoDePropostaEmDestaque } from "./AvisoDePropostaEmDestaque";
import { MobileSidebar } from "./MobileSidebar";
import { TenantSwitcher } from "./TenantSwitcher";
import { UserMenu } from "./UserMenu";
import { SearchTrigger } from "./SearchTrigger";

const RAPPORT_NAV_TABS = [
  { href: "/app/analise/alien-matrix", label: "Overview" },
  { href: "/app/crm/deals", label: "Pipeline" },
  { href: "/app/channels/whatsapp", label: "WhatsApp" },
  { href: "/app/crm/calendar", label: "Schedule" },
  { href: "/app/crm/invoices", label: "Finance" },
  { href: "/app/objects", label: "Objects" },
  { href: "/app/crm/workflows", label: "Workflows" },
  { href: "/app/ai/alien-matrix", label: "AI Agents" },
];

export function TopBar() {
  const t = useT();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 mb-6 flex h-16 w-full items-center justify-between gap-3 border-b border-[var(--rim)] bg-[var(--glass)]/80 px-4 backdrop-blur-md transition-all sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileSidebar />
        <TenantSwitcher />
      </div>

      <nav className="hidden lg:flex items-center justify-center min-w-0 max-w-2xl flex-1 px-2" aria-label="Quick Hub Navigation">
        <div className="tabs__track bg-[var(--plain)] border border-[var(--line)] rounded-full p-1 shadow-xs">
          {RAPPORT_NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "tab",
                  isActive
                    ? "bg-[var(--pill)] text-[var(--on-pill)] shadow-xs font-semibold"
                    : "text-[var(--text)] hover:bg-[var(--well)]",
                )}
              >
                {t(tab.label)}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5">
        <SearchTrigger />
        <AlertsBell />
        <AvisoDePropostaEmDestaque />
        <UserMenu />
      </div>
    </header>
  );
}
