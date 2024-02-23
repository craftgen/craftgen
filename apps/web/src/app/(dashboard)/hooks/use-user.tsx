"use client";

import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";
import posthog from "posthog-js";

export const useUser = (params?: {
  fallbackData?: RouterOutputs["auth"]["getSession"];
}) => {
  const res = api.auth.getSession.useQuery();
  if (res.data) {
    posthog.identify(res.data.user.id, {
      email: res.data.user.email,
      name: res.data.user.user_metadata?.full_name,
      username: res.data.username,
    });
  }
  return res;
};
