import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  BookOpen,
  Clock,
  Eye,
  User,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useTier, CLERK_ENABLED } from "@/hooks/useTier";

const NAV_ITEMS = [
  { href: "/scanner", label: "Scanner", icon: Activity, pro: true },
  { href: "/watchlist", label: "Watchlist", icon: Eye, pro: true },
  { href: "/backtest", label: "Backtest", icon: BarChart2, pro: true },
  { href: "/playbook", label: "Playbook", icon: BookOpen, pro: false },
  { href: "/workflow", label: "Workflow", icon: Clock, pro: false },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const tier = useTier();

  const NavList = (
    <nav className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon, pro }) => {
        const active =
          location === href || (href === "/scanner" && location === "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="nav-link"
            data-active={active}
          >
            <Icon size={15} className="nav-icon shrink-0" />
            <span className="flex-1">{label}</span>
            {pro && tier !== "pro" && (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                PRO
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const Footer = (
    <div className="border-t border-border p-2">
      <Link
        href="/account"
        onClick={() => setOpen(false)}
        className="nav-link"
        data-active={location === "/account"}
      >
        <User size={15} className="nav-icon shrink-0" />
        <span className="flex-1">Account</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {tier}
        </span>
      </Link>
      {!CLERK_ENABLED && (
        <p className="px-3 pb-1 pt-2 text-[10px] leading-snug text-muted-foreground">
          Auth disabled — set{" "}
          <code className="font-mono text-[10px]">VITE_CLERK_PUBLISHABLE_KEY</code>{" "}
          to enable sign-in.
        </p>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2 md:hidden">
        <Logo size={20} />
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/90 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-64 flex-col border-r border-border bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <Logo size={20} />
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            {NavList}
            <div className="flex-1" />
            {Footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="border-b border-border p-3">
          <Logo size={22} />
        </div>
        {NavList}
        <div className="flex-1" />
        {Footer}
      </aside>
    </>
  );
}
