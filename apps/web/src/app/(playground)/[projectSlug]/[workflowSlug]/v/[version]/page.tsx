import { Playground } from "./playground";

import "@/core/rete.css";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { api } from "@/trpc/server";
import React from "react";

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

  const workflow = await api.craft.module.meta.query({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
    version: Number(props.params.version),
  });

  if (!workflow) return <div>Not found</div>;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Playground workflow={workflow} session={session} />;
    </React.Suspense>
  );
};

export default PlaygroundPage;
