import { PropsWithChildren } from "react";
import { Session } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "@craftgen/ui/components/theme-toggle";

export const Navbar: React.FC<PropsWithChildren<{ session?: Session }>> = ({
  session,
}) => {
  return (
    <div className="fixed z-50 h-12 w-full bg-background">
      <div className="flex w-full items-center justify-between p-1">
        <div className="flex items-center">
          <div className="mr-4 flex p-2">
            <Link to="/" className="font-bold">
              CraftGen
            </Link>
          </div>
          {session && (
            <>
              {/* {params.projectSlug && <TeamSwitcher session={session} />}
              {params.workflowSlug && (
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
          {/* <FeedbackButton /> */}
          <ThemeToggle />
          {/* {session && <UserNav session={session} />}
          {!session && (
            <Link href="/login">
              <Button> Sign up</Button>
            </Link>
          )} */}
        </div>
      </div>
    </div>

    // <div className="flex gap-2 p-2 w-full bg-red-200">
    //   <Link to="/" className="[&.active]:font-bold">
    //     Home
    //   </Link>{" "}
    //   <Link to="/dashboard" className="[&.active]:font-bold">
    //     Dashboard
    //   </Link>
    //   <Link to="/about" className="[&.active]:font-bold">
    //     About
    //   </Link>
    // </div>
  );
};
