import { useClerk } from "@clerk/clerk-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/equity-calculator", label: "Equity Calculator" },
  { to: "/hands/record", label: "Record Hand" },
  { to: "/hands/library", label: "Hand Library" },
];

export default function AppLayout() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-border bg-sidebar p-4">
        <h2 className="mb-6 text-lg font-semibold text-sidebar-foreground">
          ShipInspector
        </h2>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
        >
          Sign Out
        </button>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
