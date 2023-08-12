"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Session } from "@supabase/supabase-js";
import { PropsWithChildren } from "react";
import { Network } from "lucide-react";
import { TeamSwitcher } from "./components/team-switcher";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export const Navbar: React.FC<PropsWithChildren<{ session: Session }>> = ({
  children,
  session,
}) => {
  const params = useParams();
  return (
    <div className="border-b-2">
      <div className="flex items-center justify-between w-full p-2">
        <div className="flex items-center">
          <div className="flex p-2">
            <Link href="/dashboard">
              <Network />
            </Link>
          </div>
          {params.projectSlug && <TeamSwitcher />}
        </div>
        <div>
          <ModeToggle />
        </div>
      </div>
      <div>
        <ProjectNavbar session={session} />
      </div>
    </div>
  );
};

const links = [
  {
    name: "Overview",
    href: (projectSlug: string) => `/project/${projectSlug}`,
  },
  {
    name: "Articles",
    href: (projectSlug: string) => `/project/${projectSlug}/articles`,
  },
  {
    name: "Playground",
    href: (projectSlug: string) => `/project/${projectSlug}/playground`,
  },
  {
    name: "Settings",
    href: (projectSlug: string) => `/project/${projectSlug}/settings`,
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
