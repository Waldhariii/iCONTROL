import { describe, expect, it } from "vitest";

import { isHtmlSafe } from "./html-guards";

describe("isHtmlSafe", () => {
  it("blocks <script> tags", () => {
    const candidate = `<script>alert(1)</script>`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });

  it("blocks inline event handlers in tags", () => {
    const candidate = `<div onclick="alert(1)">x</div>`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });

  it("allows harmless text containing onclick= outside tags", () => {
    const candidate = `Documentation: onclick= is mentioned as text.`;
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

  it("blocks data:text/html URLs", () => {
    const candidate = `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>`;
    expect(isHtmlSafe(candidate).ok).toBe(false);
  });

  it("accepts minimal safe HTML", () => {
    const candidate = `<div><span>ok</span></div>`;
    expect(isHtmlSafe(candidate).ok).toBe(true);
  });
});
