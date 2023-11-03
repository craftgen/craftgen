"use client";

import useSWR from "swr";

import { ResultOf } from "@/lib/type";

import { getUser } from "../actions";

export const useUser = (params?: {
  fallbackData?: ResultOf<typeof getUser>;
}) => {
  const res = useSWR("/api/auth/user", getUser, {
    ...(params?.fallbackData && { fallbackData: params?.fallbackData }),
  });
  return res;
};
