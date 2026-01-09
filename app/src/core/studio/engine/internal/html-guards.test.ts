import { describe, expect, it } from "vitest";

import { isHtmlSafe } from "./html-guards";

describe("isHtmlSafe", () => {
  it("blocks inline event handlers in tags", () => {
    const candidate = `<div onclick="alert(1)">x</div>`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });

  it("allows harmless text that mentions onclick=", () => {
    const candidate = `<pre>onclick=</pre>`;
    expect(isHtmlSafe(candidate).ok).toBe(true);
  });

  it("blocks onload handlers in tags", () => {
    const candidate = `<img onload="x" src="y">`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });

  it("blocks javascript: URLs", () => {
    const candidate = `<a href="javascript:alert(1)">x</a>`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });
});
