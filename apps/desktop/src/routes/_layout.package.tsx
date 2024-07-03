import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Command } from "@tauri-apps/plugin-shell";

import { Button } from "@craftgen/ui/components/button";
import { JSONView } from "@craftgen/ui/components/json-view";

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

  return (
    <div>
      <Button onClick={runtest}>Run Test</Button>
      <JSONView src={data} />
    </div>
  );
};

export const Route = createFileRoute("/_layout/package")({
  component: PackagePage,
});
