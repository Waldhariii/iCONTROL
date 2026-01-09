import { renderLoginPage, bindLoginEvents } from "./pages/login/loginPage";
import { renderDashboardPage, bindDashboardEvents } from "./pages/dashboard/dashboardPage";

export type HostAPI = {
  addRoute: (route: string, entry: { id: string; title: string; handler: (ctx: any) => string }) => void;
  navigate: (hashRoute: string) => void;
};

export function registerCoreSystemModule(host: HostAPI) {
  host.addRoute("login", {
    id: "core_login",
    title: "Login",
    handler: () => {
      // Bind happens after DOM mount; we emit a small boot hook
      setTimeout(() => bindLoginEvents(host), 0);
      return renderLoginPage();
    }
  });

  host.addRoute("dashboard", {
    id: "core_dashboard",
    title: "Dashboard",
    handler: () => {
      setTimeout(() => bindDashboardEvents(host), 0);
      return renderDashboardPage();
    }
  });
}
