import { Toaster } from "@/components/ui/sonner";
import { Outlet } from "@tanstack/react-router";
import React from "react";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.13 0.002 270)",
            border: "1px solid oklch(0.30 0.01 88 / 0.3)",
            color: "oklch(0.95 0 0)",
          },
        }}
      />
    </div>
  );
}
