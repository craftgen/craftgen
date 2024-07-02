import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

function App() {
  useEffect(() => {
    (async () => {
      console.log("setting up listening");
      const unsubscribe = await listen("message", (event) => {
        console.log("Received event", event);
      });

      return unsubscribe;
    })();
  }, []);

  return (
    <div className="container">
      <h1 className="font-geist text-2xl font-bold">Craftgen</h1>
    </div>
  );
}

export default App;
