"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { useHasAccess } from "../hooks/use-user";

export const ProjectNavbar: React.FC<{}> = () => {
  const params = useParams();
  const pathname = usePathname();
  const hasAccessToSettings = useHasAccess({
    projectSlug: params?.projectSlug as string,
  });

  const links = useMemo(() => {
    const links = [
      {
        name: "Overview",
        href: (projectSlug: string) => `/${projectSlug}`,
      },
      {
        name: "Settings",
        href: (projectSlug: string) => `/${projectSlug}/settings`,
      },
    ];
    if (!hasAccessToSettings) {
      return links.filter((link) => link.name !== "Settings");
    }
    return links;
  }, [hasAccessToSettings]);

  return (
    <div className="space-x-4 px-4">
      {links.map((link) => (
        <Link
          href={link.href(params?.projectSlug as string)}
          key={link.name}
          className={cn(
            "m-2 p-1 transition-all duration-200",
            "hover:rounded hover:bg-primary/10",
            pathname === link.href(params?.projectSlug as string) &&
              "border-b-2 border-primary",
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};
