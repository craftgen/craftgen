"use client";

import { useMemo } from "react";
import { type LinkProps } from "@tanstack/react-router";

import { cn } from "../lib/utils";

const isNext = (): boolean => typeof window !== "undefined" && "next" in window;

type Params = Record<string, string | number | undefined>;

const convertTanStackToNextPath = (path: string, params: Params): string => {
  return path.replace(/\$([a-zA-Z0-9]+)/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : "";
  });
};

export const CLink = ({
  Link,
  to,
  params,
  search,
  children,
  className,
}: LinkProps & { className?: string; Link: any }) => {
  if (!to) throw new Error("Link must have a `to` prop");

  const nextPath = useMemo(
    () => convertTanStackToNextPath(to as string, params as Params),
    [to, params],
  );
  const searchParams = useMemo(
    () => new URLSearchParams(search as any).toString(),
    [search],
  );
  const finalPath = useMemo(
    () => (searchParams ? `${nextPath}?${searchParams}` : nextPath),
    [nextPath, searchParams],
  );

  if (isNext()) {
    return (
      <Link href={finalPath} className={cn(className)}>
        {children}
      </Link>
    );
  } else if (import.meta.env as any) {
    return (
      <Link to={to} params={params} search={search} className={cn(className)}>
        {children}
      </Link>
    );
  } else {
    return (
      <a href={finalPath} className={cn(className)}>
        {children as any}
      </a>
    );
  }
};
