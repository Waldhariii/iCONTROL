import { buildS2SHmacHeaders } from "../ci/test-utils.mjs";

export async function ensureApiUp(baseUrl) {
  const url = `${baseUrl}/api/runtime/active-release`;
  const res = await fetch(url);
  if (!res) throw new Error("API not ready");
  return true;
}

export async function getToken({ baseUrl, principalId, secret, scopes, audience = "backend-api" }) {
  const body = JSON.stringify({ principal_id: principalId, requested_scopes: scopes, audience });
  const headers = buildS2SHmacHeaders({ principalId, secret, method: "POST", path: "/api/auth/token", body });
  const res = await fetch(`${baseUrl}/api/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function req(method, url, token, jsonBody, extraHeaders = {}) {
  const headers = { "content-type": "application/json", ...extraHeaders };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: jsonBody ? JSON.stringify(jsonBody) : undefined
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) };
}
