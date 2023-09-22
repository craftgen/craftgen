"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Session } from "@supabase/supabase-js";
import { PropsWithChildren } from "react";
import { Network, Slash } from "lucide-react";
import { TeamSwitcher } from "./components/team-switcher";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserNav } from "./components/user-nav";
import { FeedbackButton } from "./components/feedback-button";
import { Button } from "@/components/ui/button";

export const Navbar: React.FC<PropsWithChildren<{ session?: Session }>> = ({
  children,
  session,
}) => {
  const params = useParams();
  return (
    <div className="border-b-2 fixed bg-background w-full z-50">
      <div className="flex items-center justify-between w-full p-2">
        <div className="flex items-center">
          <div className="flex p-2">
            <Link href="/dashboard">
              <Network />
            </Link>
          </div>
          {params.projectSlug && session && <TeamSwitcher />}
          {params.playgroundSlug && (
            <>
              <Slash className="-rotate-12 text-muted-foreground w-4 h-4 mx-2" />
              <Link href={`/${params.projectSlug}/${params.playgroundSlug}`}>
                <span>{params.playgroundSlug}</span>
              </Link>
            </>
          )}
        </div>
        <div className="flex px-2 items-center space-x-2">
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
      <div>
        {params.projectSlug && session && <ProjectNavbar session={session} />}
      </div>
    </div>
  );
};

const links = [
  {
    name: "Overview",
    href: (projectSlug: string) => `/${projectSlug}`,
  },
  // {
  //   name: "Articles",
  //   href: (projectSlug: string) => `/${projectSlug}/articles`,
  // },
  {
    name: "Settings",
    href: (projectSlug: string) => `/${projectSlug}/settings`,
  },
];

const ProjectNavbar: React.FC<{ session: Session }> = ({ session }) => {
  const params = useParams();
  const pathname = usePathname();
  return (
    <div className="px-4 space-x-4">
      {links.map((link) => (
        <Link
          href={link.href(params?.projectSlug as string)}
          key={link.name}
          className={cn(
            "p-1 m-2 transition-all duration-200",
            "hover:bg-primary/10 hover:rounded",
            pathname === link.href(params?.projectSlug as string) &&
              "border-b-2 border-primary"
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};
