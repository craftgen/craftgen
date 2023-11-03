"use client";

import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
} from "kbar";
import { RenderResults } from "./render-results";
import { Separator } from "../ui/separator";
const actions = [
  {
    id: "explore",
    name: "Explore",
    shortcut: ["e"],
    keywords: "explore",
    perform: () => (window.location.pathname = "explore"),
  },
  {
    id: "blog",
    name: "Blog",
    shortcut: ["b"],
    keywords: "writing words",
    perform: () => (window.location.pathname = "blog"),
  },
];

export const KBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="z-30 min-w-xl flex items-start justify-center w-full pt-[14vh] py-4 pb-4  bg-foreground/20 inset-0 fixed box-border">
          <KBarAnimator className="max-w-lg bg-background w-full rounded overflow-hidden shadow-lg min-h-[30rem] z-50">
            <KBarSearch className="w-full py-4 px-4 " />
            <Separator />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};
