"use client";

import type { PropsWithChildren } from "react";
// import { useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@craftgen/ui/components/button";
import { ThemeToggle } from "@craftgen/ui/components/theme-toggle";

import { CLink } from "../components/link";
import { FeedbackButton } from "./feedback-button";
// import { TeamSwitcher } from "./components/team-switcher";
import { UserNav } from "./user-nav";

export const Navbar: React.FC<
  PropsWithChildren<{ session?: Session; Link: any }>
> = ({ session, Link }) => {
  // const params = useParams();
  return (
    <div className="fixed z-50 inline-flex h-16 w-[calc(100%-4rem)] items-center justify-between border-b bg-background p-1">
      <div className="flex w-full items-center justify-between p-1">
        <div className="flex items-center">
          <div className="mr-4 flex p-2">
            <CLink to="/" className="font-bold" Link={Link}>
              CraftGen
            </CLink>
          </div>
          {session && (
            <>
              {/* {params.projectSlug && <TeamSwitcher session={session} />} */}
              {/* {params.workflowSlug && (
                <>
                  <Slash className="mx-2 h-4 w-4 -rotate-12 text-muted-foreground" />
                  <Link href={`/${params.projectSlug}/${params.workflowSlug}`}>
                    <span>{params.workflowSlug}</span>
                  </Link>
                </>
              )} */}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2 px-2">
          <FeedbackButton />
          <ThemeToggle />
          {session && <UserNav session={session} Link={Link} />}
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
