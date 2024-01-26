import { Playground } from "./playground";

import "@/core/rete.css";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  console.log("🚀 ~ cookieStore:", cookieStore);
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  console.log("🚀 ~ supabase:", supabase);
  try {
    const workflow = await api.craft.module.get.query({
      projectSlug: props.params.projectSlug,
      workflowSlug: props.params.workflowSlug,
      executionId: props.searchParams.execution,
      version: Number(props.params.version),
    });
    console.log("🚀 ~ workflow:", workflow);

    if (!workflow) return <div>Not found</div>;
    if (!workflow.execution && props.searchParams.execution) {
      redirect(
        `/${props.params.projectSlug}/${props.params.workflowSlug}/v/${props.params.version}`,
      );
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return (
      <div>
        {JSON.stringify(
          {
            workflow,
            session,
          },
          null,
          2,
        )}
      </div>
    );
  } catch (error) {
    console.log("🚀 ~ error:", error);
    return (
      <div>
        {JSON.stringify(
          {
            error,
          },
          null,
          2,
        )}
      </div>
    );
  }
  // return <Playground workflow={workflow} session={session} />;
};

export default PlaygroundPage;
