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
  const tokens = await api.credentials.list({});
  return (
    <div>
      <TokenList tokens={tokens} projectSlug={params.projectSlug} />
    </div>
  );
};

export default TokensPage;
