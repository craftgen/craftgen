import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$projectSlug/$workflowSlug/v/$version")({
  component: () => <div>Hello /$projectSlug/$workflowslug/v/$version!</div>,
});
