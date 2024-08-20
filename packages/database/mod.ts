import type { LibSQLDatabase } from "drizzle-orm/libsql";

import * as platform from "./primary/schema/index.ts";
import * as tenant from "./tenant/schema/index.ts";

export * from "./lib/client.ts";
export * from "./lib/client-org.ts";
export * from "./lib/create-org-db.ts";

export type PlatformDbClient = LibSQLDatabase<typeof platform>;
export type TenantDbClient = LibSQLDatabase<typeof tenant>;

export { platform, tenant };
export * from "drizzle-orm";
