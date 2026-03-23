import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_pathlessLayout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h2>
        Hello "/_pathlessLayout"! <br />
        The _pathlessLayout.tsx route is used to wrap the child routes with a
        Pathless layout component:
      </h2>
      ------------------------------------------------------------
      <Outlet />
    </div>
  );
}
