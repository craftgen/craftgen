import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Command } from "@tauri-apps/plugin-shell";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { type AppRouter } from "@craftgen/ipc-api";
import { Button } from "@craftgen/ui/components/button";
import { Input } from "@craftgen/ui/components/input";
import { JSONView } from "@craftgen/ui/components/json-view";

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: "http://localhost:24321/trpc",
    }),
  ],
});

const PackagePage = () => {
  const [data, setData] = useState({});
  const runtest = async () => {
    let result = await Command.create(
      "deno",
      ["test", "http://localhost:9000/worker34.ts", "--reload", "--quiet"],
      {
        env: {
          NO_COLOR: "true",
        },
      },
    ).execute();
    console.log("RESULT", result);
    setData(result);
  };

  const rpcTest = async () => {
    const result = await client.package.cwd.query();
    setData({ result });
  };
  const [path, setPath] = useState("");
  const sendReadPath = async () => {
    const result = await client.package.get.query({
      path,
    });
    setData({ result });
  };

  return (
    <div>
      <Button onClick={runtest}>Run Test</Button>
      <Button onClick={rpcTest}>RPC Test</Button>
      <JSONView src={data} />
      <Input
        placeholder="Query"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <Button onClick={sendReadPath}>Send</Button>
    </div>
  );
};

export const Route = createFileRoute("/_layout/package")({
  component: PackagePage,
});
