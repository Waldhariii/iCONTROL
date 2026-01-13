import { navigate } from "./navigate";
import { safeRender, escapeHtml } from "./safeRender";

export type RouteHandler = (ctx: { route: string; params: Record<string, string> }) => string;

type RouteEntry = { id: string; title: string; handler: RouteHandler };

const routes = new Map<string, RouteEntry>();

export function addRoute(route: string, entry: RouteEntry) {
  routes.set(route, entry);
}

export function navigate(hashRoute: string) {
  if (!hashRoute.startsWith("#/")) hashRoute = "#/" + hashRoute.replace(/^#?\/?/, "");
  navigate(hashRoute);
}

function parseRoute(): { route: string; params: Record<string, string> } {
  const h = location.hash || "#/login";
  const [path, qs] = h.replace(/^#/, "").split("?");
  const params: Record<string, string> = {};
  if (qs) {
    for (const part of qs.split("&")) {
      const [k, v] = part.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  const route = path.startsWith("/") ? path.slice(1) : path;
  return { route, params };
}

export function bootRouter(mountId = "app") {
  const mount = document.getElementById(mountId);
  if (!mount) throw new Error(`Mount node #${mountId} introuvable`);

  const renderNow = () => {
    const { route, params } = parseRoute();
    const entry =
      routes.get(route) ||
      routes.get("login") ||
      { id: "404", title: "Introuvable", handler: () => `<div style="padding:18px">404</div>` };

    document.title = `iCONTROL — ${entry.title}`;

    const html = safeRender(
      () => entry.handler({ route, params }),
      (e) => {
        const msg = escapeHtml((e as any)?.message || String(e));
        const stack = escapeHtml((e as any)?.stack || "");
        return `
          <div style="padding:18px; font-family: system-ui">
            <h2>SAFE_RENDER — Module crash</h2>
            <div><b>Route</b>: ${escapeHtml(route)}</div>
            <div style="margin-top:10px"><b>Message</b>: ${msg}</div>
            <pre style="white-space:pre-wrap;opacity:.85;margin-top:10px">${stack}</pre>
            <div style="margin-top:12px">
              <button id="goLogin">Retour Login</button>
            </div>
          </div>
        `;
      }
    );

    mount.innerHTML = html;

    const btn = document.getElementById("goLogin");
    if (btn) btn.addEventListener("click", () => navigate("#/login"));
  };

  window.addEventListener("hashchange", renderNow);
  renderNow();
}
