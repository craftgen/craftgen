"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Network, Slash } from "lucide-react";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FeedbackButton } from "./components/feedback-button";
import { TeamSwitcher } from "./components/team-switcher";
import { UserNav } from "./components/user-nav";

export const Navbar: React.FC<PropsWithChildren<{ session?: Session }>> = ({
  children,
  session,
}) => {
  const params = useParams();
  return (
    <div className="bg-background fixed z-50 h-12 w-full">
      <div className="flex w-full items-center justify-between p-1">
        <div className="flex items-center">
          <div className="mr-4 flex p-2">
            <Link href="/explore">
              <Network />
            </Link>
          </div>
          {session && (
            <>
              {params.projectSlug && <TeamSwitcher session={session} />}
              {params.workflowSlug && (
                <>
                  <Slash className="text-muted-foreground mx-2 h-4 w-4 -rotate-12" />
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
          <ModeToggle />
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
