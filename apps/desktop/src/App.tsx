import { useState, useEffect } from "react";
import "./App.css";
import { Command } from "@tauri-apps/plugin-shell";
import { resolveResource } from "@tauri-apps/api/path";

function App() {
  // const command = Command.sidecar("binaries/welcome");
  const [res, setRes] = useState<string[]>([]);
  const callFunc = async () => {
    const SERVICE_BASE_DIR = await resolveResource("functions");
    const mainService = `${SERVICE_BASE_DIR}/main`;
    const eventWorker = `${SERVICE_BASE_DIR}/event`;
    const command = Command.sidecar("binaries/edge-runtime", [
      "start",
      "--main-service",
      mainService,
      "--event-worker",
      eventWorker,
    ], {
      env: {
        SERVICE_BASE_DIR
      }
    });

    const edgeRunner = await command.spawn();
    command.stdout.addListener("data", (line) => {
      console.log(line);
      setRes((s) => [...s, line]);
    });
    command.stderr.addListener("data", (line) => {
      console.error(line);
      setRes((s) => [...s, line]);
    });

    // const output = await Command.create("echo", "message").execute();
    // const res = await command.execute();
    console.log(res, edgeRunner);
    // await open("https://github.com/tauri-apps/tauri");
    setRes(res);
  };
  const [path, setPath] = useState<string>();
  useEffect(() => {
    (async () => {
      const p = await resolveResource("functions/main");
      setPath(p);
    })();
  }, []);

  return (
    <div className="container">
      <h1>Craftgen</h1>
      {JSON.stringify(res)}
      {path}

      <button onClick={callFunc}>Hello</button>
    </div>
  );
}

export default App;
