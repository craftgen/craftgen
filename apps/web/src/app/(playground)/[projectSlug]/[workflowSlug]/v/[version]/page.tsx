import { Playground } from "./playground";

import "@/core/rete.css";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { getWorkflow } from "@/actions/get-workflow";

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
  const { data: workflow } = await getWorkflow({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
    executionId: props.searchParams.execution,
    version: Number(props.params.version),
  });

  if (!workflow) return <div>Not found</div>;
  if (!workflow.execution && props.searchParams.execution) {
    redirect(
      `/${props.params.projectSlug}/${props.params.workflowSlug}/v/${props.params.version}`,
    );
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return <Playground workflow={workflow} session={session} />;
};

export default PlaygroundPage;
