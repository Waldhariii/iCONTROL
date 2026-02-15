import { writeReport, writeIndexLine, assertNoForbiddenReportPaths } from "./report-utils.mjs";
import { ensureApiUp, getToken, req } from "./s2s-smoke-utils.mjs";
import { execSync } from "child_process";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    baseUrl: process.env.API_BASE || "http://localhost:7070",
    principalId: process.env.S2S_PRINCIPAL || "svc:ops",
    runbookId: "",
    apply: false,
    severityId: "sev1",
    scope: "platform:*",
    title: "Runbook Execution"
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--runbook") out.runbookId = args[++i];
    else if (args[i] === "--apply") out.apply = true;
    else if (args[i] === "--severity") out.severityId = args[++i];
    else if (args[i] === "--scope") out.scope = args[++i];
    else if (args[i] === "--title") out.title = args[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  if (!args.runbookId) throw new Error("Missing --runbook <id>");
  assertNoForbiddenReportPaths();
  await ensureApiUp(args.baseUrl);

  const secret = process.env.S2S_CI_HMAC || process.env.S2S_CP_HMAC || "";
  if (!secret) throw new Error("Missing S2S HMAC secret (S2S_CI_HMAC or S2S_CP_HMAC)");

  const token = await getToken({
    baseUrl: args.baseUrl,
    principalId: args.principalId,
    secret,
    scopes: ["ops.*", "runtime.read"]
  });

  const incidentRes = await req("POST", `${args.baseUrl}/api/ops/incidents`, token, {
    severity_id: args.severityId,
    scope: args.scope,
    title: args.title
  });
  const incidentId = incidentRes.data?.id || incidentRes.data?.incident_id;
  if (!incidentId) throw new Error("Incident creation failed");

  const actionPath = args.apply ? "apply" : "execute";
  const runRes = await req(
    "POST",
    `${args.baseUrl}/api/ops/incidents/${incidentId}/runbooks/${args.runbookId}/${actionPath}`,
    token,
    {}
  );
  if (runRes.status >= 400) {
    throw new Error(`Runbook ${actionPath} failed: ${runRes.status}`);
  }

  const report = [
    "# Runbook Execution",
    `runbook_id: ${args.runbookId}`,
    `incident_id: ${incidentId}`,
    `apply: ${args.apply}`,
    `status: ${runRes.status}`
  ].join("\n");

  const reportPath = writeReport(`RUNBOOK_${args.runbookId}`, report);
  writeIndexLine("runbook_runs", {
    ts: new Date().toISOString(),
    runbook_id: args.runbookId,
    incident_id: incidentId,
    report_path: reportPath,
    apply: args.apply
  });

  execSync("node scripts/maintenance/generate-evidence-pack.mjs", { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
