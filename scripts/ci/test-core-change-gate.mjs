import { coreChangeGate } from "../../governance/gates/gates.mjs";

function expectFail(paths, note) {
  process.env.CORE_CHANGE_PATHS = paths.join("\n");
  const res = coreChangeGate();
  if (res.ok) throw new Error(`CoreChangeGate should fail (${note})`);
  for (const p of paths) {
    if (!res.details.includes(p)) {
      throw new Error(`CoreChangeGate details missing path: ${p}`);
    }
  }
}

function expectPass(paths, note) {
  process.env.CORE_CHANGE_PATHS = paths.join("\n");
  const res = coreChangeGate();
  if (!res.ok) throw new Error(`CoreChangeGate should pass (${note}): ${res.details}`);
}

try {
  expectFail(["platform/runtime/changes/patch-engine.mjs"], "restricted core change");
  expectPass(["platform/ssot/modules/domain_modules.json"], "ssot domain modules allowed");
  expectPass(["scripts/maintenance/deep-clean-v5.sh"], "maintenance scripts allowed");
  expectPass(["apps/backend-api/server.mjs"], "studio module authoring allowed");
  console.log("Core change gate PASS");
} finally {
  delete process.env.CORE_CHANGE_PATHS;
}
