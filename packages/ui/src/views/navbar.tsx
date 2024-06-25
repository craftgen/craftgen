"use client";

import type { PropsWithChildren } from "react";

import { ThemeToggle } from "@craftgen/ui/components/theme-toggle";

import { CLink } from "../components/link";
import { FeedbackButton } from "./feedback-button";

export const Navbar: React.FC<PropsWithChildren<{ Link: any }>> = ({
  Link,
  children,
}) => {
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
        </div>
        <div className="flex items-center space-x-2 px-2">
          <FeedbackButton />
          <ThemeToggle />
          {children}
        </div>
      </div>
    </div>
  );
};