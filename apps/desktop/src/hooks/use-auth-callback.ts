import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { createClient } from "../libs/supabase";

export function useOAuth(params: { onSuccess?: () => void }) {
  const supabase = createClient();
  const [port, setPort] = useState<number | null>(null);
  console.log("USE OAUTH", port);
  useEffect(() => {
    console.log("Refresh", port);

    if (port) return;

    const unlisten = listen("oauth://url", (data) => {
      setPort(null);
      if (!data.payload) return;

      const url = new URL(data.payload as string);
      const code = new URLSearchParams(url.search).get("code");

      console.log("here", data.payload, code);
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error, data }) => {
          if (data) {
            console.log("GOT DATA", data);
          }
          if (error) {
            alert(error.message);
            console.error(error);
            return;
          }
          params?.onSuccess?.();
        });
      }
    });

    let _port: number | null = null;
    invoke("plugin:oauth|start").then(async (port) => {
      console.log("NEW PORT", port);
      setPort(port as number);
      _port = port as number;
    });

    return () => {
      console.log("CANCEL", _port, port);
      unlisten?.then((u) => u());
      invoke("plugin:oauth|cancel", { port: _port });
    };
  }, []);

  return port;
}
