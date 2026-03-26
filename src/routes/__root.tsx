import {
  HeadContent,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import Footer from "../components/Footer";
import Header from "../components/Header";
import NotFound from "../components/NotFound";
import type { AuthContext } from "../auth";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: AuthContext;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => <NotFound />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      <div className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <Header />
        {children}
        <Footer />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </div>
    </>
  );
}
