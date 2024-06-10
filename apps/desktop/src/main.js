import { StrictMode, useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import "./styles.css";

import { attachConsole } from "@tauri-apps/plugin-log";

import { supabase } from "./libs/supabase";
// Import the generated route tree
import { router } from "./router";

var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };

const InnerApp = () => {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("session", session);
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);
  useEffect(() => {
    (() =>
      __awaiter(void 0, void 0, void 0, function* () {
        const detach = yield attachConsole();
        return detach;
      }))();
  }, []);
  return <RouterProvider router={router} context={{ auth: session }} />;
};
// Render the app
const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <InnerApp />
    </StrictMode>,
  );
}
