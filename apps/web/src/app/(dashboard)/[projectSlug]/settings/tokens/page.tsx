import { api } from "@/trpc/server";

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
