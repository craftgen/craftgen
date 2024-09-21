import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: () => <div>Hello /_public/!</div>,
});
