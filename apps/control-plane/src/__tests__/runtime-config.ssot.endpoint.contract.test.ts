// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRuntimeConfigRequest } from "../../../platform/api/runtime-config-server.ts";

describe("runtime-config SSOT endpoint", () => {
  async function call(path: string, method = "GET") {
    const headers = new Map<string, string>();
    let body = "";
    const req = {
      method,
      url: path,
      headers: { host: "127.0.0.1:4176" },
    } as IncomingMessage;
    const res = {
      statusCode: 200,
      setHeader: (k: string, v: string) => headers.set(k.toLowerCase(), v),
      end: (chunk?: string) => {
        body = chunk || "";
      },
    } as unknown as ServerResponse;

    handleRuntimeConfigRequest(req, res);

    return {
      status: res.statusCode,
      headers,
      body,
    };
  }

  it("GET /app/api/runtime-config returns 200 + no-store", async () => {
    const res = await call("/app/api/runtime-config");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = JSON.parse(res.body);
    expect(json.app_base_path).toBe("/app");
    expect(json.cp_base_path).toBe("/cp");
    expect(String(json.api_base_url)).toContain("/api");
  });

  it("GET /cp/api/runtime-config returns 200 + no-store", async () => {
    const res = await call("/cp/api/runtime-config");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = JSON.parse(res.body);
    expect(json.app_base_path).toBe("/app");
    expect(json.cp_base_path).toBe("/cp");
  });

  it("POST is rejected with 405", async () => {
    const res = await call("/app/api/runtime-config", "POST");
    expect(res.status).toBe(405);
  });

  it("querystring is ignored for payload", async () => {
    const res1 = await call("/app/api/runtime-config");
    const res2 = await call("/app/api/runtime-config?x=1");
    const json1 = JSON.parse(res1.body);
    const json2 = JSON.parse(res2.body);
    expect(json2).toEqual(json1);
  });
});
