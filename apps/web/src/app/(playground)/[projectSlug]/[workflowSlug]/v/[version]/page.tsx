import { Playground } from "./playground";

import "@/core/rete.css";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { api } from "@/trpc/server";
import React from "react";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    workflowSlug: string;
    version: string;
  };
  searchParams: {
    execution?: string;
  };
}) => {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  try {
    const workflow = await api.craft.module.meta({
      projectSlug: props.params.projectSlug,
      workflowSlug: props.params.workflowSlug,
      version: Number(props.params.version),
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return <Playground workflow={workflow} session={session} />;
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code === "NOT_FOUND") {
        notFound();
      }
    }
  }
};

export default PlaygroundPage;
