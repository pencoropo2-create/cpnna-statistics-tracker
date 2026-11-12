import { AccessGate } from "@/components/access/AccessGate";
import { InviteGate } from "@/components/access/InviteGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import AdminPage from "@/pages/AdminPage";
import Formato1Page from "@/pages/Formato1Page";
import Formato2Page from "@/pages/Formato2Page";
import HomePage from "@/pages/HomePage";
import PanelPage from "@/pages/PanelPage";
import ReportesPage from "@/pages/ReportesPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

function RootLayout() {
  return (
    <AccessGate>
      <InviteGate>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </InviteGate>
    </AccessGate>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const formato1Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/formato-1",
  component: Formato1Page,
});

const formato2Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/formato-2",
  component: Formato2Page,
});

const panelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panel",
  component: PanelPage,
});

const reportesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reportes",
  component: ReportesPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  formato1Route,
  formato2Route,
  panelRoute,
  reportesRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}
