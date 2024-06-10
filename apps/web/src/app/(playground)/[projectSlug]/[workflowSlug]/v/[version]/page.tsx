import { Playground } from "./playground";

import "@/core/rete.css";

import React from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { TRPCError } from "@trpc/server";

import { api } from "@/trpc/server";

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
      executionId: props.searchParams.execution,
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
