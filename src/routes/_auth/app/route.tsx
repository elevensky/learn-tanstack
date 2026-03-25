import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  return (
    <div>
      <h1>App Layout Routes</h1>
      <p>used to wrap child routes with additional components and logic</p>
      <Outlet />
    </div>
  );
}
