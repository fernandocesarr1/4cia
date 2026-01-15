import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CalendarOff, 
  ClipboardList, 
  X,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/policiais", label: "Policiais", icon: Users },
  { path: "/afastamentos", label: "Afastamentos", icon: CalendarOff },
  { path: "/auditoria", label: "Auditoria", icon: ClipboardList },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="bg-sidebar-accent p-1.5 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-bold">SIGO</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="bg-sidebar-accent p-2 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">SIGO</h2>
            <p className="text-xs text-sidebar-foreground/60">4ª Cia PM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <p className="text-xs text-sidebar-foreground/50 text-center">
            SIGO v1.0.0 • Polícia Militar
          </p>
        </div>
      </aside>
    </>
  );
}
