import { api } from "@/trpc/server";

import { getProject } from "../../actions";
import { TokenList } from "./token-item";

const TokensPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug);
  const tokens = await api.credentials.list.query({ projectId: project?.id! });
  return (
    <div>
      <TokenList tokens={tokens} />
    </div>
  );
};

export default TokensPage;
