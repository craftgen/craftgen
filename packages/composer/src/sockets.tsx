import { useCallback } from "react";

import { SocketNameType } from "@craftgen/core/sockets";

interface SocketConfig {
  badge: string;
  color: string;
  connection: string;
}

export const socketConfig: Record<SocketNameType, SocketConfig> = {
  trigger: { badge: "bg-red-500", color: "bg-red-300", connection: "red" },
  any: { badge: "bg-gray-500", color: "bg-gray-300", connection: "gray" },
  number: {
    badge: "bg-indigo-500",
    color: "bg-indigo-300",
    connection: "indigo",
  },
  boolean: {
    badge: "bg-yellow-500",
    color: "bg-yellow-300",
    connection: "yellow",
  },
  array: { badge: "bg-green-500", color: "bg-green-300", connection: "green" },
  string: { badge: "bg-teal-500", color: "bg-teal-300", connection: "teal" },
  object: { badge: "bg-blue-500", color: "bg-blue-300", connection: "blue" },
  // audio: {
  //   badge: "bg-purple-500",
  //   color: "bg-purple-300",
  //   connection: "purple",
  // },
  // document: {
  //   badge: "bg-violet-500",
  //   color: "bg-violet-300",
  //   connection: "violet",
  // },
  // embedding: { badge: "bg-cyan-500", color: "bg-cyan-300", connection: "cyan" },
  // task: {
  //   badge: "bg-orange-500",
  //   color: "bg-orange-300",
  //   connection: "orange",
  // },
  // image: {
  //   badge: "bg-emerald-500",
  //   color: "bg-emerald-300",
  //   connection: "emerald",
  // },
  // databaseIdSocket: {
  //   badge: "bg-stone-500",
  //   color: "bg-stone-300",
  //   connection: "stone",
  // },
  date: {
    badge: "bg-rose-500",
    color: "bg-rose-300",
    connection: "rose",
  },
  tool: {
    badge: "bg-lime-500",
    color: "bg-lime-300",
    connection: "lime",
  },
  thread: {
    badge: "bg-amber-500",
    color: "bg-amber-300",
    connection: "amber",
  },
};

export const useSocketConfig = (name: SocketNameType) => {
  const getConfig = useCallback((name: SocketNameType) => {
    return socketConfig[name] || socketConfig.any;
  }, []);
  return getConfig(name);
};
