import { useEffect, useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/stores";
import { PokerOptions } from "@/components/settings";
import {
  Percent,
  Table2,
  FolderOpen,
  Settings,
  PanelLeft,
  PanelLeftClose,
  Menu,
  LogOut,
  Calculator,
} from "@/assets/icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageHeaderProvider, usePageHeader } from "./PageHeaderContext";

const mainNavItems = [
  { to: "/equity-calculator", label: "Equity Calculator", icon: Percent },
  { to: "/hands/record", label: "Record Hand", icon: Table2 },
  { to: "/hands/library", label: "Hand Library", icon: FolderOpen },
];

const utilityItems: Array<{ to: string; label: string; icon: typeof Calculator }> = [
  { to: "/utilities/pot-odds", label: "Pot Odds Calculator", icon: Calculator },
  { to: "/utilities/spr", label: "SPR Calculator", icon: Calculator },
];

function SidebarNav({
  collapsed,
  onSignOut,
  onNavClick,
}: {
  collapsed: boolean;
  onSignOut: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
        {/* Main nav items */}
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed ? "justify-center" : "px-3",
              )
            }
            title={label}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Utilities section */}
        {collapsed ? (
          // Collapsed mode: show Calculator icon with popover
          utilityItems.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
                  title="Utilities"
                  aria-label="Utilities"
                >
                  <Calculator className="size-4 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-48">
                <div className="flex flex-col gap-1">
                  {utilityItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onNavClick}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        ) : (
          // Expanded mode: show section header with utility links
          <>
            <div className="mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              <Calculator className="mr-1.5 inline size-3" />
              Utilities
            </div>
            {utilityItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )
                }
                title={label}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <button
        onClick={onSignOut}
        title="Sign Out"
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50",
          collapsed ? "justify-center" : "px-3",
        )}
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed && <span>Sign Out</span>}
      </button>
    </>
  );
}

export default function AppLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const trayOpen = useSettingsStore((s) => s.trayOpen);
  const setTrayOpen = useSettingsStore((s) => s.setTrayOpen);
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Keyboard shortcut: Ctrl+B / Cmd+B toggles sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <PageHeaderProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar (Sheet overlay, below md) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex w-64 flex-col p-4"
        >
          <SheetTitle className="mb-4 text-lg font-semibold">
            ShipInspector
          </SheetTitle>
          <SidebarNav
            collapsed={false}
            onSignOut={handleSignOut}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar (md and above) */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar p-2 transition-all duration-200",
          collapsed ? "md:w-16" : "md:w-64 md:p-4",
        )}
      >
        {/* Sidebar header */}
        <div className="mb-4 flex items-center justify-between">
          {collapsed ? (
            <h2 className="w-full truncate text-center text-sm font-semibold text-sidebar-foreground">
              SI
            </h2>
          ) : (
            <h2 className="truncate text-lg font-semibold text-sidebar-foreground">
              ShipInspector
            </h2>
          )}
        </div>

        <SidebarNav collapsed={collapsed} onSignOut={handleSignOut} />

        {/* Toggle button - bottom right */}
        <div className={cn("mt-2 flex", collapsed ? "justify-center" : "justify-end")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-sidebar-foreground"
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Global actions bar */}
        <HeaderBar
          onMobileMenuOpen={() => setMobileOpen(true)}
          onSettingsToggle={() => setTrayOpen(!trayOpen)}
          trayOpen={trayOpen}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>

        {/* Settings tray - slide-out panel */}
        <div
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-72 border-l border-border bg-background shadow-lg transition-transform duration-200 md:w-80",
            trayOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-full flex-col pt-16">
            <PokerOptions onClose={() => setTrayOpen(false)} />
          </div>
        </div>

        {/* Backdrop when tray open (mobile) */}
        {trayOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setTrayOpen(false)}
            aria-label="Close settings"
          />
        )}
      </div>
    </div>
    </PageHeaderProvider>
  );
}

function HeaderBar({
  onMobileMenuOpen,
  onSettingsToggle,
  trayOpen,
}: {
  onMobileMenuOpen: () => void;
  onSettingsToggle: () => void;
  trayOpen: boolean;
}) {
  const { headerContent } = usePageHeader();

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-2">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      {/* Page-specific header content */}
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        {headerContent}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onSettingsToggle}
        aria-label="Settings"
        aria-pressed={trayOpen}
      >
        <Settings className="size-4" />
      </Button>
    </header>
  );
}
