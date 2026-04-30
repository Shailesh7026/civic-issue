import type { Metadata } from "next";
import { AuthSidebar } from "@/components/auth/auth-sidebar";
import React from "react";

export const metadata: Metadata = {
  title: "Auth - CivicIntel",
  description: "Your City's Intelligence Hub",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1200px] h-[800px] max-h-[90vh] bg-card rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-border/50">
        <AuthSidebar />
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
