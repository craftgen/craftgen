"use client";

import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
} from "kbar";

import { Separator } from "../ui/separator";
import { RenderResults } from "./render-results";

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
        <KBarPositioner className="min-w-xl bg-background/60 fixed inset-0 z-30 box-border flex w-full items-start  justify-center py-4 pb-4 pt-[14vh]">
          <KBarAnimator className="bg-background/80 z-50 min-h-[30rem] w-full max-w-lg overflow-hidden rounded-xl border shadow-lg  backdrop-blur-sm backdrop-filter bg-clip-padding">
            <KBarSearch className="bg-background  w-full px-4 py-3 outline-none " />
            <Separator className="w-full" />
            <div className="mt-2 p-2">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};
