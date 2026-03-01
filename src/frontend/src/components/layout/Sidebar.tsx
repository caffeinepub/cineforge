import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppContext } from "@/contexts/AppContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  Clapperboard,
  Crown,
  FolderOpen,
  GitBranch,
  Home,
  Loader2,
  LogIn,
  LogOut,
  Mic,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: Home,
    gold: false,
    accent: false,
    teal: false,
    purple: false,
  },
  {
    to: "/ai-director",
    label: "AI Director",
    icon: Clapperboard,
    gold: true,
    accent: false,
    teal: false,
    purple: false,
  },
  {
    to: "/pipeline",
    label: "Pipeline",
    icon: GitBranch,
    gold: false,
    accent: true,
    teal: false,
    purple: false,
  },
  {
    to: "/video-gen",
    label: "Video Gen",
    icon: Video,
    gold: false,
    accent: false,
    teal: true,
    purple: false,
  },
  {
    to: "/voice-engine",
    label: "Voice Engine",
    icon: Mic,
    gold: false,
    accent: false,
    teal: false,
    purple: true,
  },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderOpen,
    gold: false,
    accent: false,
    teal: false,
    purple: false,
  },
  {
    to: "/presets",
    label: "Presets",
    icon: Sparkles,
    gold: false,
    accent: false,
    teal: false,
    purple: false,
  },
  {
    to: "/subscription",
    label: "Subscription",
    icon: Crown,
    gold: false,
    accent: false,
    teal: false,
    purple: false,
  },
];

export default function Sidebar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { userProfile, isPro } = useAppContext();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      login();
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-16 lg:w-56 flex flex-col h-full glass-panel-dark border-r border-border/50 shrink-0">
        {/* Logo */}
        <div className="p-3 lg:px-4 lg:py-3 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 glass-panel flex items-center justify-center">
            <img
              src="/assets/generated/cineforge-logo-transparent.dim_200x200.png"
              alt="CineForge"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-display font-bold text-[15px] gold-gradient leading-tight tracking-tight">
              CineForge
            </span>
            <span className="text-[9px] tracking-[0.18em] text-muted-foreground/60 uppercase">
              Studio
            </span>
          </div>
        </div>

        {/* Plan badge */}
        {isAuthenticated && (
          <div className="px-3 py-2">
            <div
              className={`hidden lg:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit tracking-widest ${
                isPro
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-[inset_0_1px_0_oklch(1_0_0/0.10)]"
                  : "bg-white/[0.04] text-muted-foreground/70 border border-white/[0.08]"
              }`}
            >
              {isPro && <Crown className="w-3 h-3" />}
              {isPro ? "PRO" : "FREE"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3">
          {NAV_ITEMS.map(
            ({ to, label, icon: Icon, gold, accent, teal, purple }) => (
              <NavItem
                key={to}
                to={to}
                label={label}
                Icon={Icon}
                gold={gold}
                accent={accent}
                teal={teal}
                purple={purple}
              />
            ),
          )}
        </nav>

        {/* Bottom: User + Auth */}
        <div className="border-t border-white/[0.06] p-2 flex flex-col gap-1">
          {isAuthenticated && userProfile && (
            <div className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-md">
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_oklch(1_0_0/0.10)]">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs text-foreground/60 truncate max-w-[100px] font-medium">
                {userProfile.displayName}
              </span>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-2 py-2 rounded-md w-full text-left hover:bg-white/[0.05] transition-colors text-muted-foreground/60 hover:text-foreground disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                ) : isAuthenticated ? (
                  <LogOut className="w-4 h-4 shrink-0" />
                ) : (
                  <LogIn className="w-4 h-4 shrink-0" />
                )}
                <span className="hidden lg:block text-xs font-medium">
                  {isLoggingIn
                    ? "Signing in…"
                    : isAuthenticated
                      ? "Sign Out"
                      : "Sign In"}
                </span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="lg:hidden">
              {isAuthenticated ? "Sign Out" : "Sign In"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavItem({
  to,
  label,
  Icon,
  gold = false,
  accent = false,
  teal = false,
  purple = false,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  gold?: boolean;
  accent?: boolean;
  teal?: boolean;
  purple?: boolean;
}) {
  const matchRoute = useMatchRoute();
  const isActive = matchRoute({ to, fuzzy: to !== "/" });

  // accent = pipeline blue color
  const accentColor = "oklch(0.65 0.14 240)";
  // teal = video gen teal color
  const tealColor = "oklch(0.65 0.14 175)";
  // purple = voice engine purple color
  const purpleColor = "oklch(0.65 0.18 300)";

  const activeStyle =
    !isActive && accent
      ? { color: `${accentColor}B3` }
      : !isActive && teal
        ? { color: `${tealColor}B3` }
        : !isActive && purple
          ? { color: `${purpleColor}B3` }
          : undefined;

  const activeLabelStyle =
    !isActive && accent
      ? { color: `${accentColor}CC` }
      : !isActive && teal
        ? { color: `${tealColor}CC` }
        : !isActive && purple
          ? { color: `${purpleColor}CC` }
          : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-md transition-all duration-200 group relative ${
              isActive
                ? "nav-active text-primary"
                : gold
                  ? "text-primary/70 hover:text-primary hover:bg-primary/[0.06]"
                  : accent || teal || purple
                    ? "hover:bg-white/[0.05]"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.05]"
            }`}
            style={activeStyle}
          >
            <span
              className={`w-4 h-4 shrink-0 transition-colors flex items-center justify-center ${
                isActive
                  ? "text-primary"
                  : gold
                    ? "text-primary/70 group-hover:text-primary"
                    : "group-hover:text-foreground"
              }`}
              style={activeStyle}
            >
              <Icon className="w-4 h-4" />
            </span>
            <span
              className={`hidden lg:block text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : gold
                    ? "text-primary/80 group-hover:text-primary"
                    : ""
              }`}
              style={activeLabelStyle}
            >
              {label}
            </span>
            {/* Gold accent dot for AI Director */}
            {gold && !isActive && (
              <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            )}
            {/* Blue accent dot for Pipeline */}
            {accent && !isActive && (
              <span
                className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: accentColor }}
              />
            )}
            {/* Teal accent dot for Video Gen */}
            {teal && !isActive && (
              <span
                className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: tealColor }}
              />
            )}
            {/* Purple accent dot for Voice Engine */}
            {purple && !isActive && (
              <span
                className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: purpleColor }}
              />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="lg:hidden glass-panel border-border/50"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
