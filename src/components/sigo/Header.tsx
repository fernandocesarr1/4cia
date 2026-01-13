import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/types";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="header-gradient text-primary-foreground shadow-header">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/10 p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">SIGO</h1>
                <p className="text-xs text-primary-foreground/70 hidden sm:block">
                  Sistema Integrado de Gestão Operacional
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">4ª Companhia PM</p>
              <p className="text-xs text-primary-foreground/70">{CURRENT_USER}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-sm font-bold">CP</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
