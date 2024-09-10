import { cacheExchange, Client, fetchExchange } from "@urql/core";

import { env } from "@/env.mjs";

export const client = new Client({
  url: env.WORDPRESS_API_URL,
  exchanges: [cacheExchange, fetchExchange],
});
