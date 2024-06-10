"use client";

import { useMemo } from "react";

import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";

export const useUser = (params?: {
  fallbackData?: RouterOutputs["auth"]["getSession"];
}) => {
  const res = api.auth.getSession.useQuery();
  return res;
};

export const useHasAccess = (params: { projectSlug: string }) => {
  const { data: user } = useUser();
  const currentProjectSlug = useMemo(() => {
    return user?.user.user_metadata.currentProjectSlug;
  }, [user]);
  return currentProjectSlug === params.projectSlug;
};
