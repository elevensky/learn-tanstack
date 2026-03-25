import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/dashboard"!</div>;
}
