"use client";

import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";

export const useUser = (params?: {
  fallbackData?: RouterOutputs["auth"]["getSession"];
}) => {
  const res = api.auth.getSession.useQuery();
  return res;
};
