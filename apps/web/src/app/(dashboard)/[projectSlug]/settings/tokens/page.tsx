import { TokenList } from "@craftgen/ui/views/token-item";

import { api } from "@/trpc/server";

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
