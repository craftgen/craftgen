"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

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

export const ProjectNavbar: React.FC<{}> = () => {
  const params = useParams();
  const pathname = usePathname();
  return (
    <div className="space-x-4 px-4">
      {links.map((link) => (
        <Link
          href={link.href(params?.projectSlug as string)}
          key={link.name}
          className={cn(
            "m-2 p-1 transition-all duration-200",
            "hover:bg-primary/10 hover:rounded",
            pathname === link.href(params?.projectSlug as string) &&
              "border-primary border-b-2",
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
};
