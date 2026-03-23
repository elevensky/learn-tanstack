import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pathlessLayout/a")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_pathlessLayout/a"! PathlessLayout A</div>;
}
