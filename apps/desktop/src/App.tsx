import { useState, useEffect } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-shell";
// import { resolveResource } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

function App() {
  // const command = Command.sidecar("binaries/welcome");
  const [res, setRes] = useState<string[]>([]);
  const callFuncOnRust = async () => {
    open("https://localhost:3000");
    invoke("start_edge_runtime").then(() => console.log("Completed!"));
  };
  useEffect(() => {
    console.log("setting up listening");
    const unsubscribe = listen("message", (event) => {
      console.log("Received", event);
      setRes((s) => [...s, event.payload]);
    });

    return async () => {
      await unsubscribe();
    };
  }, []);
  // const callFunc = async () => {
  //   const SERVICE_BASE_DIR = await resolveResource("functions");
  //   const mainService = `${SERVICE_BASE_DIR}/main`;
  //   const eventWorker = `${SERVICE_BASE_DIR}/event`;
  //   const command = Command.sidecar(
  //     "binaries/edge-runtime",
  //     ["start", "--main-service", mainService, "--event-worker", eventWorker],
  //     {
  //       env: {
  //         SERVICE_BASE_DIR,
  //       },
  //     },
  //   );

  //   const edgeRunner = await command.spawn();
  //   command.stdout.addListener("data", (line) => {
  //     console.log(line);
  //     setRes((s) => [...s, line]);
  //   });
  //   command.stderr.addListener("data", (line) => {
  //     console.error(line);
  //     setRes((s) => [...s, line]);
  //   });

  //   // const output = await Command.create("echo", "message").execute();
  //   // const res = await command.execute();
  //   console.log(res, edgeRunner);
  //   // await open("https://github.com/tauri-apps/tauri");
  //   setRes(res);
  // };

  return (
    <div className="container">
      <h1>Craftgen</h1>
      <button onClick={callFuncOnRust}>Open Craftgen</button>
      {res.map((r, i) => (
        <p key={i}>{r}</p>
      ))}
      {/* {JSON.stringify(res)} */}
    </div>
  );
}

export default App;
