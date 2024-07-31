import { openKv } from "@deno/kv";

type OrgId = `org-${string}`;
export const createKv = async (params: { orgId: OrgId }) => {
  const kv = await openKv(
    `${Deno.env.get("DB_LOCATION")}/kv-${params.orgId}.db`,
  );

  return kv;
};
