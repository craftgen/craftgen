"use client";

import { useMemo } from "react";

import { RouterOutputs } from "@craftgen/api";
import { api } from "@craftgen/ui/lib/api";

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
