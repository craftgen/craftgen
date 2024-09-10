"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

import { useUser } from "../app/(dashboard)/hooks/use-user";

export const PHIdentify = () => {
  const searchParams = useSearchParams();
  const { data: user } = useUser();
  const posthog = usePostHog();
  const pathname = usePathname();
  const router = useRouter();

  if (user && searchParams.has("identify")) {
    posthog.identify(user.user.id, {
      email: user.email,
      name: user.fullName,
      username: user.username,
    });
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("identify");
    router.replace(`${pathname}${nextSearchParams.toString()}`);
  }

  return null;
};
