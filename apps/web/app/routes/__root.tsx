import * as React from "react";
import { getAuth } from "@clerk/tanstack-start/server";
import { QueryClient } from "@tanstack/react-query";
import {
  createRootRoute,
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import {
  Body,
  createServerFn,
  Head,
  Html,
  Meta,
  Scripts,
} from "@tanstack/start";
import { setCookie, setHeaders } from "vinxi/http";

import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { Providers } from "~/providers";
// @ts-expect-error
import appCss from "~/styles/app.css?url";
import { trpcQueryUtils } from "~/trpc/react";
import { seo } from "~/utils/seo";

const fetchClerkAuth = createServerFn("GET", async (_, ctx) => {
  const auth = await getAuth(ctx.request);
  const token = await auth.getToken();
  if (token) {
    setCookie("craftgen-jwt", token);
  }

  return {
    auth,
  };
});

export interface RouterAppContext {
  client: typeof trpcQueryUtils;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  meta: () => [
    {
      charSet: "utf-8",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    ...seo({
      title:
        "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
      description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
    }),
  ],
  links: () => [
    { rel: "stylesheet", href: appCss },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
    { rel: "icon", href: "/favicon.ico" },
  ],
  beforeLoad: async () => {
    const { auth } = await fetchClerkAuth();

    return {
      auth,
    };
  },
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  context: ({ context }) => {
    return {
      client: trpcQueryUtils,
    };
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <Providers>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </Providers>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head>
        <Meta />
      </Head>
      <Body>
        {children}
        <ScrollRestoration />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-right" />
        )}
        <Scripts />
      </Body>
    </Html>
  );
}
