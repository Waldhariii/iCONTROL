/**
 * Phase AG: Control Plane Cockpit v1 - read-only ops views.
 */
(function () {
  const DEFAULT_API_BASE = "http://127.0.0.1:7070";
  const kinds = ["gates", "workflows", "marketplace", "billing", "webhook", "ops", "releases", "scheduler", "breakglass", "quorum"];

  function el(id) {
    return document.getElementById(id);
  }

  function getApiBase() {
    return (el("apiBase") && el("apiBase").value.trim()) || DEFAULT_API_BASE;
  }

  function api(path) {
    return getApiBase().replace(/\/$/, "") + path;
  }

  async function fetchJson(path) {
    const res = await fetch(api(path), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(path + " " + res.status);
    return res.json();
  }

  function renderHealth(data) {
    const pre = el("healthOut");
    if (!pre) return;
    pre.textContent = data ? JSON.stringify(data, null, 2) : "-";
  }

  function renderActiveRelease(data) {
    const pre = el("activeReleaseOut");
    if (!pre) return;
    pre.textContent = data ? JSON.stringify(data, null, 2) : "-";
  }

  function renderFreeze(data) {
    const pre = el("freezeOut");
    if (!pre) return;
    pre.textContent = data ? JSON.stringify(data, null, 2) : "-";
  }

  function renderIndex(kind, lines) {
    const wrap = el("index_" + kind);
    if (!wrap) return;
    const pre = wrap.querySelector("pre");
    if (!pre) return;
    pre.textContent = Array.isArray(lines) && lines.length
      ? lines.slice(-15).map(function (l) { return JSON.stringify(l); }).join("\n")
      : "(empty)";
  }

  async function loadHealth() {
    try {
      const data = await fetchJson("/api/health");
      renderHealth(data);
      return true;
    } catch (e) {
      renderHealth({ error: String(e.message) });
      return false;
    }
  }

  async function loadActiveRelease() {
    try {
      const data = await fetchJson("/api/runtime/active-release");
      renderActiveRelease(data);
      return true;
    } catch (e) {
      renderActiveRelease({ error: String(e.message) });
      return false;
    }
  }

  async function loadFreeze() {
    try {
      const data = await fetchJson("/api/studio/freeze");
      renderFreeze(data);
      return true;
    } catch (e) {
      renderFreeze({ error: String(e.message) });
      return false;
    }
  }

  async function loadIndex(kind) {
    try {
      const data = await fetchJson("/api/reports/latest?kind=" + encodeURIComponent(kind) + "&limit=50");
      renderIndex(kind, data.lines || []);
      return true;
    } catch (e) {
      renderIndex(kind, [{ error: String(e.message) }]);
      return false;
    }
  }

  async function loadAll() {
    await loadHealth();
    await loadActiveRelease();
    await loadFreeze();
    for (var i = 0; i < kinds.length; i++) await loadIndex(kinds[i]);
  }

  function bind() {
    const btn = el("refreshBtn");
    if (btn) btn.onclick = loadAll;
  }

  function init() {
    bind();
    loadAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
