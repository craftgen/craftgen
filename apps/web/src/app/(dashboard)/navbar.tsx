"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Slash } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@craftgen/ui/button";

import { FeedbackButton } from "./components/feedback-button";
import { TeamSwitcher } from "./components/team-switcher";
import { UserNav } from "./components/user-nav";

export const Navbar: React.FC<PropsWithChildren<{ session?: Session }>> = ({
  children,
  session,
}) => {
  const params = useParams();
  return (
    <div className="fixed z-50 h-12 w-full bg-background">
      <div className="flex w-full items-center justify-between p-1">
        <div className="flex items-center">
          <div className="mr-4 flex p-2">
            <Link href="/explore" className="font-bold">
              CraftGen
            </Link>
          </div>
          {session && (
            <>
              {params.projectSlug && <TeamSwitcher session={session} />}
              {params.workflowSlug && (
                <>
                  <Slash className="mx-2 h-4 w-4 -rotate-12 text-muted-foreground" />
                  <Link href={`/${params.projectSlug}/${params.workflowSlug}`}>
                    <span>{params.workflowSlug}</span>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2 px-2">
          <FeedbackButton />
          <ThemeToggle />
          {session && <UserNav session={session} />}
          {!session && (
            <Link href="/login">
              <Button> Sign up</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
