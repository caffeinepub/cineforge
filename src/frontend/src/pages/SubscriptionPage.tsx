import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Loader2, Shield, Sparkles, X, Zap } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { toast } from "sonner";

const FREE_FEATURES = [
  { text: "Basic timeline editing", available: true },
  { text: "Up to 3 projects", available: true },
  { text: "Free presets (3 of 5)", available: true },
  { text: "720p export", available: true },
  { text: "Watermark on export", available: true },
  { text: "4K export", available: false },
  { text: "No watermark", available: false },
  { text: "All 5 cinematic presets", available: false },
  { text: "Unlimited projects", available: false },
];

const PRO_FEATURES = [
  { text: "All FREE features", available: true },
  { text: "Unlimited projects", available: true },
  { text: "All 5 cinematic presets", available: true },
  { text: "4K export (simulated)", available: true },
  { text: "No watermark on export", available: true },
  { text: "Priority support", available: true },
  { text: "Early access to new presets", available: true },
];

export default function SubscriptionPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { isPro, refetchProfile } = useAppContext();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.upgradeSubscription();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      refetchProfile();
      toast.success("Upgraded to Pro! Enjoy unlimited cinematic power.");
    },
    onError: (e) => toast.error(`Upgrade failed: ${e.message}`),
  });

  const downgradeMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.downgradeSubscription();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionStatus"] });
      toast.success("Downgraded to Free plan");
    },
    onError: (e) => toast.error(`Downgrade failed: ${e.message}`),
  });

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Demo Mode Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-primary/50 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 px-5 py-4 flex items-start gap-3"
      >
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-primary mb-0.5">
            🎬 Demo Mode Active — All Pro Features Unlocked for Preview
          </p>
          <p className="text-xs text-primary/70 leading-relaxed">
            All features including premium presets, 4K export, and unlimited
            projects are fully enabled so you can explore and promote the
            complete CineForge experience. When you launch publicly, users can
            subscribe to unlock these features permanently.
          </p>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <p className="label-cinematic mb-2">Membership</p>
        <h1 className="heading-cinematic gold-gradient text-4xl md:text-5xl">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground/60 mt-2 text-sm max-w-md mx-auto">
          Unlock the full cinematic experience — from color grading to 4K export
        </p>
      </motion.div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-10">
        {/* FREE */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={`glass-panel rounded-2xl p-6 relative ${!isPro && isAuthenticated ? "border-white/[0.12]" : ""}`}
        >
          {!isPro && isAuthenticated && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-white/[0.08] text-muted-foreground/70 border border-white/[0.10] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                Current Plan
              </span>
            </div>
          )}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]">
              <Sparkles className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-display font-bold text-foreground/80 tracking-tight">
                FREE
              </h2>
              <p className="text-muted-foreground/50 text-xs mt-0.5">
                Get started for free
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-foreground/70">
                $0
              </span>
              <span className="text-muted-foreground/40 text-xs">/mo</span>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                {f.available ? (
                  <Check className="w-3.5 h-3.5 text-green-400/80 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-muted-foreground/25 shrink-0" />
                )}
                <span
                  className={
                    f.available
                      ? "text-foreground/70"
                      : "text-muted-foreground/35 text-[13px]"
                  }
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            className="w-full border-white/[0.10] text-muted-foreground/50 bg-white/[0.03] text-sm"
            disabled
          >
            {!isAuthenticated
              ? "Sign in to start"
              : isPro
                ? "Free Plan"
                : "Current Plan"}
          </Button>
          {isPro && isAuthenticated && (
            <button
              type="button"
              onClick={() => downgradeMutation.mutate()}
              disabled={downgradeMutation.isPending}
              className="mt-2 w-full text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors text-center"
            >
              {downgradeMutation.isPending
                ? "Processing…"
                : "Downgrade to Free"}
            </button>
          )}
        </motion.div>

        {/* PRO */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel-elevated rounded-2xl p-6 relative"
        >
          {isPro && isAuthenticated && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="btn-gold text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase inline-block">
                Current Plan
              </span>
            </div>
          )}

          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[inset_0_1px_0_oklch(1_0_0/0.12)]">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-display font-bold gold-gradient tracking-tight">
                PRO
              </h2>
              <p className="text-muted-foreground/50 text-xs mt-0.5">
                Unlimited creative power
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-bold gold-gradient">
                $9.99
              </span>
              <span className="text-muted-foreground/40 text-xs">/mo</span>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                <span className="text-foreground/80">{f.text}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 border border-primary/25 text-primary text-sm font-semibold shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]">
              <Check className="w-4 h-4" />
              You're on Pro — Everything unlocked
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
            >
              <Button
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending || !isAuthenticated}
                className="btn-gold w-full gap-2"
              >
                {upgradeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    {isAuthenticated ? "Upgrade to Pro" : "Sign in to Upgrade"}
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap justify-center gap-8 max-w-xl mx-auto"
      >
        {[
          { icon: <Shield className="w-3.5 h-3.5" />, label: "Secure on ICP" },
          {
            icon: <Zap className="w-3.5 h-3.5" />,
            label: "Instant activation",
          },
          { icon: <Check className="w-3.5 h-3.5" />, label: "Cancel anytime" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-muted-foreground/40 text-xs"
          >
            <span className="text-primary/60">{icon}</span>
            {label}
          </div>
        ))}
      </motion.div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-white/[0.05] text-center text-[11px] text-muted-foreground/30">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/60 transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
