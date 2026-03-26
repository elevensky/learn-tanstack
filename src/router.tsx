import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { defaultAuthContext } from "./auth";

const queryClient = new QueryClient();

const router = createTanStackRouter({
  routeTree,
  context: { queryClient, auth: defaultAuthContext },
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export async function getRouter() {
  return router;
}
