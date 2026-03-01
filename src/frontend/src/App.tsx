import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQuery } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import React from "react";

import { AppProvider, useAppContext } from "@/contexts/AppContext";
import { EditorProvider } from "@/contexts/EditorContext";
import { ProjectProvider } from "@/contexts/ProjectContext";

import ProfileSetupModal from "@/components/ProfileSetupModal";
import AppShell from "@/components/layout/AppShell";
import AIDirectorPage from "@/pages/AIDirectorPage";
import DashboardPage from "@/pages/DashboardPage";
import EditorPage from "@/pages/EditorPage";
import PipelinePage from "@/pages/PipelinePage";
import PresetsPage from "@/pages/PresetsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";

// Root route with AppShell layout
const rootRoute = createRootRoute({
  component: AppRootLayout,
});

// Pages
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const presetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/presets",
  component: PresetsPage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscription",
  component: SubscriptionPage,
});

const aiDirectorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-director",
  component: AIDirectorPage,
});

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pipeline",
  component: PipelinePage,
});

const editorNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/new",
  component: function EditorNewPage() {
    return (
      <EditorProvider>
        <ProjectProvider>
          <EditorPage />
        </ProjectProvider>
      </EditorProvider>
    );
  },
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$projectId",
  component: function EditorWithId() {
    const { projectId } = editorRoute.useParams();
    return (
      <EditorProvider>
        <ProjectProvider>
          <EditorPage projectId={projectId} />
        </ProjectProvider>
      </EditorProvider>
    );
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aiDirectorRoute,
  pipelineRoute,
  projectsRoute,
  presetsRoute,
  subscriptionRoute,
  editorNewRoute,
  editorRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppRootLayout() {
  return (
    <AppProvider>
      <AppRootWithProfile />
    </AppProvider>
  );
}

function AppRootWithProfile() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  const showProfileSetup =
    isAuthenticated &&
    !actorFetching &&
    !profileLoading &&
    isFetched &&
    userProfile === null;

  return (
    <>
      <AppShell />
      {showProfileSetup && (
        <ProfileSetupModal open={true} onComplete={() => {}} />
      )}
    </>
  );
}

export default function App() {
  return <RouterProvider router={router} />;
}
