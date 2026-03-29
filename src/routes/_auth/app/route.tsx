import {
  Link,
  Outlet,
  createFileRoute,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import { useAuth } from "#/auth";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    void auth.logout().then(async () => {
      queryClient.clear();
      await router.invalidate();
      await navigate({ to: "/" });
    });
  };

  return (
    <>
      <Header />
      <main className="p-2 h-full">
        <h1>App Layout Routes</h1>
        <p>used to wrap child routes with additional components and logic</p>
        <ul className="py-2 flex gap-2">
          <li>
            <Link
              to="/app/dashboard"
              className="hover:underline data-[status='active']:font-semibold"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/app/users/$userId"
              params={{ userId: "demo-user" }}
              className="hover:underline data-[status='active']:font-semibold"
            >
              User
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="hover:underline"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>
        <hr />
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
