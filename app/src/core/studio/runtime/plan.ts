import type { BlueprintDoc } from "../blueprints/types";
import type { RenderOp, RenderPlan } from "./types";
import { ok, err } from "./result";

type Obj = Record<string, unknown>;

function isObj(x: unknown): x is Obj {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function isStr(x: unknown): x is string {
  return typeof x === "string";
}
function asObj(x: unknown): Obj | null {
  return isObj(x) ? x : null;
}
function asArr(x: unknown): unknown[] | null {
  return Array.isArray(x) ? x : null;
}

function pushText(ops: RenderOp[], value: unknown) {
  ops.push({ op: "text", value: isStr(value) ? value : String(value) });
}

function pushComponent(ops: RenderOp[], id: unknown) {
  ops.push({ op: "component", id: isStr(id) ? id : String(id) });
}

/**
 * compilePlan:
 * - Goal: best-effort blueprint->render ops extraction (pure, no side-effects).
 * - Always returns a Result; never throws.
 * - Strategy:
 *   1) If blueprint.data.ops[] exists -> map supported ops.
 *   2) Else if blueprint.data.components[] exists -> emit component ops.
 *   3) Else if blueprint.data.pages[].blocks[] exists -> emit ops from blocks.
 *   4) Else fallback -> single text op with stable JSON.
 */
export function compilePlan(doc: BlueprintDoc): ReturnType<typeof ok<RenderPlan> | typeof err> {
  try {
    const data = asObj((doc as any).data);
    if (!data) return err("invalid_input", "blueprint_missing_data_object");

    const ops: RenderOp[] = [];

    // 1) data.ops[] passthrough (highest ROI / lowest risk)
    const opsArr = asArr(data.ops);
    if (opsArr) {
      for (const raw of opsArr) {
        const o = asObj(raw);
        if (!o) continue;
        const op = o.op;
        if (op === "text") {
          pushText(ops, o.value ?? "");
        } else if (op === "component") {
          pushComponent(ops, o.id ?? "unknown");
        }
      }
      if (ops.length) return ok({ ops });
    }

    // 2) data.components[] -> component ops
    const comps = asArr(data.components);
    if (comps) {
      for (const c of comps) {
        const o = asObj(c);
        if (o && "id" in o) pushComponent(ops, (o as any).id);
        else pushComponent(ops, c);
      }
      if (ops.length) return ok({ ops });
    }

    // 3) data.pages[].blocks[] (common blueprint pattern)
    const pages = asArr(data.pages);
    if (pages) {
      for (const p of pages) {
        const po = asObj(p);
        if (!po) continue;
        const blocks = asArr(po.blocks);
        if (!blocks) continue;

        for (const b of blocks) {
          const bo = asObj(b);
          if (!bo) continue;

          // Prefer explicit component id/type if present
          if ("componentId" in bo) {
            pushComponent(ops, (bo as any).componentId);
            continue;
          }
          if ("type" in bo) {
            const t = (bo as any).type;
            // If block has "text" content, emit text; else treat type as component id.
            if ("text" in bo && (typeof (bo as any).text === "string" || typeof (bo as any).text === "number")) {
              pushText(ops, (bo as any).text);
            } else {
              pushComponent(ops, t);
            }
            continue;
          }
          // Fallback block -> stringify into text op
          
          pushText(ops, JSON.stringify(bo));

        }
      }
      if (ops.length) return ok({ ops });
    }

    /* COMPILEPLAN_BLOCKS_RECOVERY_V1
       Goal: if upstream parsing misses doc.data.blocks, recover in a tolerant, low-risk way.
       Prevent JSON-stringify fallback when blocks are valid.
    */
    try {
      if (ops.length === 0 && isObj(doc)) {
        const d: any = (doc as any);
        const blocks: any[] | null = Array.isArray(d?.data?.blocks)
          ? d.data.blocks
          : (Array.isArray(d?.blocks) ? d.blocks : null);

        if (blocks && blocks.length) {
          const mapId = (t: unknown): string => {
            const s = String(t ?? "").trim();
            if (s === "table") return "builtin.table";
            if (s === "form") return "builtin.form";
            return s; // default: raw type as component id
          };

          for (const b of blocks) {
            const bo: any = b;

            if (!isObj(bo)) {
              pushText(ops, String(bo));
              continue;
            }

            // Canonical text block
            if (String(bo.type ?? "") === "text" && (typeof bo.text === "string" || typeof bo.text === "number")) {
              pushText(ops, String(bo.text));
              continue;
            }

            // If block has text, prefer text
            if ("text" in bo && (typeof bo.text === "string" || typeof bo.text === "number")) {
              pushText(ops, String(bo.text));
              continue;
            }

            // Otherwise, treat as component
            if ("type" in bo) {
              pushComponent(ops, mapId(bo.type));
              continue;
            }

            // Last resort
            pushText(ops, JSON.stringify(bo));
          }

          if (ops.length) return ok({ ops });
        }
      }
    } catch {
      // no-op: fallback continues below
    }

    // 4) Final fallback (guaranteed non-empty output)
    return ok({ ops: [{ op: "text", value: JSON.stringify(doc) }] });
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}
