import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { MsaActivationWizard } from "@/components/MsaActivationWizard";
import { AcquisitionCampaignWizard } from "@/components/acquisition-campaign/AcquisitionCampaignWizard";
import { MsaMarketsPanel } from "@/components/layout/sidebar/MsaMarketsPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  width: number;
  onResizeStart: (event: React.MouseEvent) => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium leading-tight transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
  );

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  width,
  onResizeStart,
}: SidebarProps) {
  const navigate = useNavigate();
  const { allMsas } = useNetwork();
  const {
    selectedMsaId,
    hoveredMsaId,
    activationMsa,
    closeActivation,
    recordRecentMsa,
    setHoveredMsaId,
  } = useMsaNavigation();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={cn(
          "relative z-50 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-150 ease-out",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[300px]",
          "lg:relative lg:sticky lg:top-0",
          collapsed ? "lg:w-[72px] lg:min-w-[72px] lg:max-w-[72px]" : "",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
        style={!collapsed ? { width, minWidth: width, maxWidth: width } : undefined}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-sidebar-border px-2.5 py-2.5">
          {!collapsed && (
            <p
              className="min-w-0 max-w-full flex-1 font-bold text-foreground"
              style={{
                fontSize: "1.125rem",
                lineHeight: 1.3,
                fontWeight: 700,
                whiteSpace: "normal",
                overflowWrap: "break-word",
              }}
            >
              Phoenix Compliance Dashboard
            </p>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 shrink-0 lg:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 py-1">
          <div className="shrink-0">
            <NavLink to="/" end className={navLinkClass} onClick={onMobileClose}>
              <LayoutDashboard className="size-4 shrink-0" />
              {!collapsed && <span>Executive Dashboard</span>}
            </NavLink>
          </div>

          {collapsed ? (
            <>
              <Separator className="my-3" />
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                {allMsas.map((msa) => {
                  const isActive = msa.id === selectedMsaId;
                  const isHovered = msa.id === hoveredMsaId;
                  return (
                    <button
                      key={msa.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-center rounded-md p-2 transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : isHovered
                            ? "bg-sidebar-accent text-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                      onClick={() => {
                        recordRecentMsa(msa.id);
                        navigate(`/msa/${msa.id}`);
                        onMobileClose();
                      }}
                      onMouseEnter={() => setHoveredMsaId(msa.id)}
                      onMouseLeave={() => setHoveredMsaId(null)}
                      title={msa.name}
                    >
                      <MapPin className="size-4 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-1.5 flex min-h-0 flex-1 flex-col">
              <MsaMarketsPanel onNavigate={onMobileClose} />
            </div>
          )}
        </div>

        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onMouseDown={onResizeStart}
            className="absolute inset-y-0 right-0 z-10 hidden w-2 translate-x-1/2 cursor-col-resize lg:block"
          >
            <div className="mx-auto h-full w-px bg-transparent transition-colors hover:bg-border" />
          </div>
        )}
      </aside>

      <MsaActivationWizard
        msa={activationMsa}
        open={activationMsa !== null}
        onOpenChange={(open) => !open && closeActivation()}
      />
      <AcquisitionCampaignWizard />
    </>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { width, startResize } = useSidebarWidth();

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        width={width}
        onResizeStart={startResize}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <p className="text-sm text-muted-foreground">Healthcare Expansion</p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
