import { useClerk } from "@clerk/clerk-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/stores";
import { PokerOptions } from "@/components/settings";
import { Percent, Table2, FolderOpen, Settings } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/equity-calculator", label: "Equity Calculator", icon: Percent },
  { to: "/hands/record", label: "Record Hand", icon: Table2 },
  { to: "/hands/library", label: "Hand Library", icon: FolderOpen },
];

export default function AppLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const trayOpen = useSettingsStore((s) => s.trayOpen);
  const setTrayOpen = useSettingsStore((s) => s.setTrayOpen);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Menu (SI-70) */}
      <aside className="flex w-16 flex-col border-r border-border bg-sidebar p-2 md:w-64 md:p-4">
        <h2 className="mb-4 hidden truncate text-lg font-semibold text-sidebar-foreground md:block">
          ShipInspector
        </h2>
        <h2 className="mb-4 truncate text-center text-sm font-semibold text-sidebar-foreground md:hidden">
          SI
        </h2>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors md:px-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  "justify-center md:justify-start",
                )
              }
              title={label}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 md:px-3"
        >
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col">
        {/* Global actions bar (SI-71) */}
        <header className="flex shrink-0 items-center justify-end gap-2 border-b border-border bg-background px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTrayOpen(!trayOpen)}
            aria-label="Settings"
            aria-pressed={trayOpen}
          >
            <Settings className="size-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Settings tray - slide-out panel (SI-71, SI-72) */}
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
  );
}
