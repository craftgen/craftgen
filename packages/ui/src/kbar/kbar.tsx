"use client";

import { KBarAnimator, KBarPortal, KBarPositioner, KBarSearch } from "kbar";

import { Separator } from "../components/separator";
import { RenderResults } from "./render-results";
import { KBarProviderWrapper } from "./provider";
import { Command } from "lucide-react";

export const KBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <KBarProviderWrapper>
      <KBarCore />
      {children}
    </KBarProviderWrapper>
  );
};

export const KBarCore = () => {
  return (
    <KBarPortal>
      <KBarPositioner className="min-w-xl fixed inset-0 z-30 box-border flex w-full items-start justify-center  bg-background/60 py-4 pb-4 pt-[14vh]">
        <KBarAnimator className="z-50 min-h-[30rem] w-full max-w-lg overflow-hidden rounded border bg-background/80 bg-clip-padding  shadow-lg backdrop-blur-sm backdrop-filter">
          <div className="flex items-center justify-between">
            <KBarSearch className="w-full  bg-background px-4 py-2 outline-none " />
            <div className="pointer-events-none flex h-4 w-24 select-none items-center justify-center">
              <span className="flex items-center p-1 text-sm text-muted">
                <Command className="mr-1 h-4 w-4" />
                <span className="">+ K</span>
              </span>
            </div>
          </div>
          <Separator className="w-full" />
          <div className="mt-2 p-2">
            <RenderResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
};
