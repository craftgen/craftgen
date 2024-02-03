import { Playground } from "./playground";

import "@/core/rete.css";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

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

  const workflow = await api.craft.module.meta.query({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
    version: Number(props.params.version),
  });

  if (!workflow) return <div>Not found</div>;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <Playground workflow={workflow} session={session} />;
};

export default PlaygroundPage;
