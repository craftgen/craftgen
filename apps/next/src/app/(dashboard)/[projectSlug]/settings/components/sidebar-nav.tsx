"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { buttonVariants } from "@craftgen/ui/components/button";

import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const params = useParams();
  const getHref = useCallback(
    (href: string) => {
      return href.replace("[projectSlug]", params?.projectSlug as string);
    },
    [params],
  );
  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={getHref(item.href)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === getHref(item.href)
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
