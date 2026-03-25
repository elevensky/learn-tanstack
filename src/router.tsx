import { QueryClient } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { AuthProvider, defaultAuthContext, useAuth } from "./auth";

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

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}

export async function getRouter() {
  return router;
}

export function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

export default App;
