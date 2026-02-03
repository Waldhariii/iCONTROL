import React from "react";
import { definePageSpec } from "../_governance/pageSpec";
import { obsInfo } from "../../../core/ports/telemetry.contract"; // must exist (observability-min)

export const PAGE_SPEC = definePageSpec({
  id: "jobs",
  title: "Jobs",
  route: "/app/#/jobs",
  moduleKey: "core-system",
});

export default function Page() {
  // Correlation can be injected via your runtime; keep safe fallback.
  const correlationId = "corr_" + Math.random().toString(16).slice(2);
  try {
    obsInfo({ correlationId, code: "OK", message: "page_view", details: { pageId: PAGE_SPEC.id } });
  } catch {}
  return (
    <div style={{ padding: 16 }}>
      <h1>Jobs</h1>
      <p>Page métier MVP (governed). id={PAGE_SPEC.id}</p>
    </div>
  );
}
