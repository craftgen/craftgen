// import NextLink from "next/link";
import { useMemo } from "react";
import { LinkProps, Link as TLink } from "@tanstack/react-router";

import { cn } from "../lib/utils";

const isNext = (): boolean => typeof window !== "undefined" && "next" in window;

type Params = Record<string, string | number | undefined>;

const convertTanStackToNextPath = (path: string, params: Params): string => {
  return path.replace(/\$([a-zA-Z0-9]+)/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : "";
  });
};

export const Link = ({
  to,
  params,
  search,
  children,
  className,
}: LinkProps & { className?: string }) => {
  if (!to) throw new Error("Link must have a `to` prop");

  const nextPath = useMemo(
    () => convertTanStackToNextPath(to, params),
    [to, params],
  );
  const searchParams = useMemo(
    () => new URLSearchParams(search).toString(),
    [search],
  );
  const finalPath = useMemo(
    () => (searchParams ? `${nextPath}?${searchParams}` : nextPath),
    [nextPath, searchParams],
  );

  if (isNext()) {
    const NextLink = require("next/link").default;

    return (
      <NextLink href={finalPath} className={cn(className)}>
        {children}
      </NextLink>
    );
  }

  return (
    <TLink to={to} params={params} search={search} className={cn(className)}>
      {children}
    </TLink>
  );
};
