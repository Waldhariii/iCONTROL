import type { Rule } from "./types";
import type { RuleResult } from "./result";
import { err } from "./result";

export function runRules(rules: Rule[], input: unknown, ctx: import("./types").RuleContext): RuleResult {
  try {
    for (const r of rules) {
      const out = r.apply(input, ctx);
      if (out.ok) return out;
      // Not applicable -> keep going; other failures are terminal.
      if (!out.ok && out.reason !== "not_applicable") return out;
    }
    return err("not_applicable", "no_rule_matched");
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}
