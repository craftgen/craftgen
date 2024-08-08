import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { CodeEditor } from "@craftgen/composer/ui/control/control-code";
import { type AppRouter } from "@craftgen/ipc-api";
import { Button } from "@craftgen/ui/components/button";
import { Input } from "@craftgen/ui/components/input";
import { JSONView } from "@craftgen/ui/components/json-view";
import {
  File,
  Folder,
  Tree,
  useTree,
} from "@craftgen/ui/components/tree-view-api";

import { NodeManager } from "../libs/files";

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: "http://localhost:8787/trpc",
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

  const rpcTest = async (id: string) => {
    const result = await client.context.query({
      machineId: id,
      type: "text",
      payload: "Hello World",
      delay: "5s",
    });
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
      <Button onClick={() => rpcTest("123")}>RPC Test 123</Button>
      <JSONView src={data} />
      <Input
        placeholder="Query"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <FolderRoot path="functions" dir={BaseDirectory.Resource} />
      <Button onClick={sendReadPath}>Send</Button>
    </div>
  );
};

const FolderRoot = ({ dir, path }: { dir: BaseDirectory; path: string }) => {
  const { data: files } = useQuery({
    queryKey: [`file:${dir}`],
    queryFn: async ({ queryKey }) => {
      const files = await client.fs.readDir.query({
        path: "/",
      });
      return files;
    },
    initialData: [],
  });

  return (
    <>
      <Tree>
        {files.map((file) =>
          file.isDirectory ? (
            <Folder element={file.name} value={file.name}>
              <TreeFileTest path={`/${file.name}`} dir={dir} enabled={true} />
            </Folder>
          ) : (
            <File value={file.name}>
              <span>{file.name}</span>
            </File>
          ),
        )}
      </Tree>
    </>
  );
};

const TreeFileTest = (props: {
  path: string;
  dir: BaseDirectory;
  enabled: boolean;
}) => {
  const { data: files } = useQuery({
    queryKey: [`file:${props.path}`],
    queryFn: async ({ queryKey }) => {
      const files = await client.fs.readDir.query({
        path: props.path,
      });
      return files;
    },
    initialData: [],
    enabled: props.enabled,
  });

  const { expendedItems } = useTree();
  const [hover, setHover] = useState(false);

  return (
    <>
      {files.map((file) =>
        file.isDirectory ? (
          <div
            onMouseOver={() => {
              console.log("HOVER", file.name);
              setHover(true);
            }}
            onMouseOut={() => setHover(false)}
          >
            <Folder element={file.name} value={`${props.path}/${file.name}`}>
              {
                <TreeFileTest
                  path={`${props.path}/${file.name}`}
                  dir={props.dir}
                  enabled={
                    true ||
                    expendedItems?.includes(`${props.path}/${file.name}`)!
                  }
                />
              }
            </Folder>
          </div>
        ) : (
          <File value={file.name}>
            <span>{file.name}</span>
          </File>
        ),
      )}
    </>
  );
};

export const Route = createFileRoute("/_layout/package")({
  component: PackagePage,
});
