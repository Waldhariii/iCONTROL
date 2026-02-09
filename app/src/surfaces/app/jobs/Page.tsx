import React from "react";
import { useTenantContext } from '@/core/tenant/tenantContext';

import { newCorrelationIdSSOT } from "../../../core/observability/correlation";
import { getTenantIdSSOT } from "../../../core/tenant/tenantContext";
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
  const correlationId = newCorrelationIdSSOT();
  try {
    obsInfo({ correlationId, code: "OK", message: "page_view", details: { pageId: PAGE_SPEC.id } });
  } catch {}
  return (
    <div className="ic-page">
      <h1>Jobs</h1>
      <p>Page métier MVP (governed). id={PAGE_SPEC.id}</p>
    </div>
  );
}
