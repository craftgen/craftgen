"use client";

import { Action, KBarProvider } from "kbar";

const actions: Action[] = [
  {
    id: "home",
    name: "Home",
    shortcut: ["h"],
    keywords: "home",
    section: "Navigation",
    perform: () => (window.location.pathname = "/"),
  },
  {
    id: "explore",
    name: "Explore",
    shortcut: ["e"],
    keywords: "explore",
    section: "Navigation",
    perform: () => (window.location.pathname = "explore"),
  },
  {
    id: "blog",
    name: "Blog",
    shortcut: ["b"],
    keywords: "writing words",
    section: "Navigation",
    perform: () => (window.location.pathname = "blog"),
  },
];

export const KBarProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <KBarProvider actions={actions}>{children}</KBarProvider>;
};
