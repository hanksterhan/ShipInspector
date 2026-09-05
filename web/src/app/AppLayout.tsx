import { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  Sailboat,
  Layers3,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PageHeaderProvider } from "./PageHeaderContext";

const navGroups = [
  {
    label: "PLAY",
    items: [{ to: "/tables", label: "Private tables", icon: Users, key: "" }],
  },
  {
    label: "WORKSPACE",
    items: [
      {
        to: "/equity-calculator",
        label: "Equity Calculator",
        icon: Percent,
        key: "1",
      },
      { to: "/hands/record", label: "Record Hand", icon: Table2, key: "2" },
      {
        to: "/hands/library",
        label: "Hand Library",
        icon: FolderOpen,
        key: "3",
      },
    ],
  },
  {
    label: "QUICK TOOLS",
    items: [
      {
        to: "/utilities/pot-odds",
        label: "Pot Odds",
        icon: Calculator,
        key: "",
      },
      {
        to: "/utilities/spr",
        label: "Stack-to-Pot Ratio",
        icon: Layers3,
        key: "",
      },
    ],
  },
];

function SidebarNav({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="app-nav">
      {navGroups.map((group) => (
        <div className="nav-group" key={group.label}>
          {!collapsed && <div className="nav-label">{group.label}</div>}
          {group.items.map(({ to, label, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "nav-link",
                  isActive && "is-active",
                  collapsed && "is-collapsed",
                )
              }
            >
              <Icon size={18} strokeWidth={1.7} />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {key && <kbd>{key}</kbd>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    trayOpen,
    setTrayOpen,
    sidebarCollapsed: collapsed,
    toggleSidebar,
  } = useSettingsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const keyboard = () => {
      document.documentElement.dataset.inputMethod = "keyboard";
    };
    const pointer = () => {
      document.documentElement.dataset.inputMethod = "pointer";
    };
    window.addEventListener("keydown", keyboard, true);
    window.addEventListener("pointerdown", pointer, true);
    return () => {
      window.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("pointerdown", pointer, true);
    };
  }, []);
  const section = location.pathname.startsWith("/utilities")
    ? "Quick tools"
    : location.pathname.startsWith("/tables")
      ? "Private tables"
      : "Study room";

  return (
    <PageHeaderProvider>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside className={cn("app-sidebar", collapsed && "sidebar-collapsed")}>
          <NavLink
            to="/equity-calculator"
            className="brand"
            aria-label="ShipInspector home"
          >
            <span className="brand-mark">
              <Sailboat size={22} strokeWidth={1.6} />
            </span>
            {!collapsed && (
              <span>
                ShipInspector<span className="brand-dot">.</span>
              </span>
            )}
          </NavLink>
          <SidebarNav collapsed={collapsed} />
          <div className="sidebar-footer">
            {!collapsed && (
              <div className="study-note">
                <span className="status-dot" /> Study workspace{" "}
                <ArrowUpRight size={13} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Sign Out"
                title="Sign Out"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut size={16} />
                {!collapsed && "Sign Out"}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeft size={16} />
                ) : (
                  <PanelLeftClose size={16} />
                )}
              </Button>
            </div>
          </div>
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              menuButton.current?.focus();
            }}
            className="mobile-nav"
            aria-describedby={undefined}
          >
            <SheetTitle className="brand">
              <Sailboat size={24} />
              ShipInspector.
            </SheetTitle>
            <SidebarNav
              collapsed={false}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="app-content">
          <header className="app-topbar">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              ref={menuButton}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </Button>
            <div className="breadcrumb">
              ShipInspector <span>/</span> <strong>{section}</strong>
            </div>
            <div className="topbar-actions">
              <span className="mode-badge">
                <span className="status-dot" />
                {location.pathname.startsWith("/tables")
                  ? "Play chips"
                  : "Study mode"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTrayOpen(true)}
                ref={settingsButton}
                aria-label="Settings"
              >
                <Settings size={18} />
              </Button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="workspace-main">
            <Outlet />
          </main>
        </div>
        <Sheet open={trayOpen} onOpenChange={setTrayOpen}>
          <SheetContent
            side="right"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              settingsButton.current?.focus();
            }}
            className="w-80"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">Table settings</SheetTitle>
            <PokerOptions />
          </SheetContent>
        </Sheet>
      </div>
    </PageHeaderProvider>
  );
}
