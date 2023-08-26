import { Table } from "@/components/ui/table";
import { getProject, getProjectTokens } from "../../actions";
import { TokenList } from "./token-item";

const TokensPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await getProject(params.projectSlug);
  const tokens = await getProjectTokens({ project_id: project?.id! });
  return (
    <div>
      <TokenList tokens={tokens} />
    </div>
  );
};

export default TokensPage;
