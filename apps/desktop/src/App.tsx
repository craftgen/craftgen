import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@craftgen/ui/components/button";

function App() {
  const callFuncOnRust = async () => {
    invoke("start_edge_runtime").then(() => console.log("Completed!"));
  };
  useEffect(() => {
    (async () => {
      console.log("setting up listening");
      const unsubscribe = await listen("message", (event) => {
        console.log("Received", event);
      });

      return unsubscribe;
    })();
  }, []);
  return (
    <div className="container">
      <h1 className="text-2xl font-bold">Craftgen</h1>
      <Button onClick={callFuncOnRust}>Start Edge Runtime</Button>
      {/* {JSON.stringify(res)} */}
    </div>
  );
}

export default App;
