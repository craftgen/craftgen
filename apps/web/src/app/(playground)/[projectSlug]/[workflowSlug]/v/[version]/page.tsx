import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { Playground } from "@craftgen/composer/playground";

import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/server";

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
  const supabase = createClient();

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

    return <Playground workflow={workflow} session={session} Link={Link} />;
  } catch (e) {
    if (e instanceof TRPCError) {
      if (e.code === "NOT_FOUND") {
        notFound();
      }
    }
  }
};

export default PlaygroundPage;
