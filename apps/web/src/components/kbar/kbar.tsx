"use client";

import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  useRegisterActions,
} from "kbar";

import { Separator } from "../ui/separator";
import { RenderResults } from "./render-results";
import { useUser } from "@/app/(dashboard)/hooks/use-user";
import { useRouter } from "next/navigation";
import { KBarProviderWrapper } from "./provider";
import { isNil } from "lodash-es";
import { useMemo } from "react";

export const KBar: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <KBarProviderWrapper>
      <KBarCore />
      {children}
    </KBarProviderWrapper>
  );
};

export const KBarCore = () => {
  const { data: user } = useUser();
  const router = useRouter();

  const currentProjectSlug = useMemo(() => {
    return user?.user.user_metadata.currentProjectSlug;
  }, [user]);

  useRegisterActions(
    [
      ...(!isNil(currentProjectSlug)
        ? [
            {
              id: "profile",
              name: "Profile",
              shortcut: ["@"],
              keywords: "profile",
              perform: () => router.push(`/${currentProjectSlug}`),
            },
          ]
        : [
            {
              id: "login",
              name: "Login",
              shortcut: ["@"],
              keywords: "login",
              perform: () => router.push(`/login`),
            },
          ]),
    ],
    [user],
  );
  return (
    <KBarPortal>
      <KBarPositioner className="min-w-xl bg-background/60 fixed inset-0 z-30 box-border flex w-full items-start  justify-center py-4 pb-4 pt-[14vh]">
        <KBarAnimator className="bg-background/80 z-50 min-h-[30rem] w-full max-w-lg overflow-hidden rounded-xl border bg-clip-padding  shadow-lg backdrop-blur-sm backdrop-filter">
          <KBarSearch className="bg-background  w-full px-4 py-3 outline-none " />
          <Separator className="w-full" />
          <div className="mt-2 p-2">
            <RenderResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
};
