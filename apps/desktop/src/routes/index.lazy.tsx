import { createLazyFileRoute } from "@tanstack/react-router";

import App from "../App";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <App />
    </div>
  );
}
