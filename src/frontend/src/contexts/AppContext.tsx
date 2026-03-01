import type { SubscriptionStatus, UserProfile } from "@/backend.d";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AppContextValue {
  userProfile: UserProfile | null;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  isPro: boolean;
  refetchProfile: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });

  const { data: subscriptionStatus, isLoading: subLoading } =
    useQuery<SubscriptionStatus>({
      queryKey: ["subscriptionStatus"],
      queryFn: async () => {
        if (!actor) throw new Error("No actor");
        return actor.getSubscriptionStatus();
      },
      enabled: !!actor && !actorFetching && isAuthenticated,
    });

  const isLoading =
    actorFetching || (isAuthenticated && (profileLoading || subLoading));
  const isPro = subscriptionStatus?.plan?.toLowerCase() === "pro";

  return (
    <AppContext.Provider
      value={{
        userProfile: userProfile ?? null,
        subscriptionStatus: subscriptionStatus ?? null,
        isLoading,
        isPro,
        refetchProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
