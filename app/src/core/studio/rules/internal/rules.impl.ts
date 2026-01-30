export type RuleValueRef =
  | { type: "const"; value: string | number | boolean | null }
  | { type: "role" }
  | { type: "flag"; value: "SAFE_MODE" }
  | { type: "setting"; path: "language" | "theme" }
  | { type: "field"; path: string }
  | { type: "storage"; path: string };

export type RuleCondition =
  | { op: "all"; args: RuleCondition[] }
  | { op: "any"; args: RuleCondition[] }
  | { op: "not"; arg: RuleCondition }
  | { op: "eq"; left: RuleValueRef; right: RuleValueRef }
  | { op: "exists"; value: RuleValueRef };

export type RuleEffect = {
  type: "setVisible" | "disable";
  target: {
    type: "page" | "component" | "column" | "action";
    id?: string;
    tableId?: string;
    columnId?: string;
    actionId?: string;
  };
  value: boolean;
};

export type RuleDef = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  when: RuleCondition;
  then: RuleEffect[];
};

const STORAGE_ALLOW = new Set([
  "icontrol_iam_v1.role",
  "icontrol_settings_v1.language",
  "icontrol_settings_v1.theme"
]);

export type RuleContext = {
  role: string;
  safeMode: boolean;
  settings: { language?: string; theme?: string };
  fields?: Record<string, unknown>;
  storageGet: (key: string) => string | null;
};

export function evaluateCondition(cond: RuleCondition, ctx: RuleContext): boolean {
  if (cond.op === "all") return cond.args.every((c) => evaluateCondition(c, ctx));
  if (cond.op === "any") return cond.args.some((c) => evaluateCondition(c, ctx));
  if (cond.op === "not") return !evaluateCondition(cond.arg, ctx);
  if (cond.op === "eq") return String(resolveValue(cond.left, ctx)) === String(resolveValue(cond.right, ctx));
  if (cond.op === "exists") return resolveValue(cond.value, ctx) !== undefined;
  return false;
}

export function resolveValue(ref: RuleValueRef, ctx: RuleContext): unknown {
  if (ref.type === "const") return ref.value;
  if (ref.type === "role") return ctx.role;
  if (ref.type === "flag") return ref.value === "SAFE_MODE" ? ctx.safeMode : false;
  if (ref.type === "setting") {
    if (ref.path === "language") return ctx.settings.language;
    if (ref.path === "theme") return ctx.settings.theme;
  }
  if (ref.type === "field") return ctx.fields ? ctx.fields[ref.path] : undefined;
  if (ref.type === "storage") {
    if (!STORAGE_ALLOW.has(ref.path)) return undefined;
    const [key, field] = ref.path.split(".");
    const raw = ctx.storageGet(key);
    if (!raw) return undefined;
    try {
      const obj = JSON.parse(raw);
      return field ? obj?.[field] : obj;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function applyRules(
  rules: RuleDef[],
  ctx: RuleContext
): RuleEffect[] {
  const enabled = rules.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  const effects: RuleEffect[] = [];
  enabled.forEach((r) => {
    if (evaluateCondition(r.when, ctx)) effects.push(...r.then);
  });
  return effects;
}
