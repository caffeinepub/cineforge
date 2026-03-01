import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Loader2, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
}: ProfileSetupModalProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const name = displayName.trim() || "Filmmaker";
      await actor.updateUserProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile created! Welcome to CineForge.");
      onComplete();
    },
    onError: (e) => toast.error(`Setup failed: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="glass-panel border-primary/20 max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="/assets/generated/cineforge-logo-transparent.dim_200x200.png"
                alt="CineForge"
                className="w-full h-full object-cover"
              />
            </div>
            <DialogTitle className="text-lg font-display font-bold gold-gradient">
              Welcome to CineForge
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            You're in. Set your filmmaker name to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium">
              Your Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Kubrick"
                className="pl-9 bg-muted/20 border-border/50 focus:border-primary/50"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="btn-gold w-full gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clapperboard className="w-4 h-4" />
            )}
            {mutation.isPending ? "Setting up…" : "Start Creating"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
