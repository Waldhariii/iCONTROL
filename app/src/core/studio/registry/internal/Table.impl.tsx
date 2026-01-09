import React from "react";
import type { DatasourceDef, QueryDef } from "../../engine/datasources";
import { applyQuery, resolveDatasource } from "../../engine/datasources";
import type { RuleContext, RuleDef, RuleEffect } from "../../engine/rules";
import { applyRules } from "../../engine/rules";
import { safeRender } from "../../engine/safe-render";

type ColumnDef = {
  id: string;
  key: string;
  label: string;
  type: "text" | "date" | "money" | "badge" | "action";
  rules?: string[];
  visibleForRoles?: string[];
  format?: string;
  width?: number;
  align?: "left" | "center" | "right";
  computed?: string;
};

type TableDef = {
  id: string;
  columns: ColumnDef[];
  actions?: Array<{
    id: string;
    label: string;
    actionType: "navigate" | "openModal" | "exportCsv" | "noop";
    rules?: string[];
    requiredRoles?: string[];
    config?: Record<string, unknown>;
  }>;
};

type Props = {
  tableDefRef?: string;
  tableDef?: TableDef;
  datasourceId?: string;
  query?: QueryDef;
  role?: string;
  datasources?: Record<string, DatasourceDef>;
  tables?: Record<string, TableDef>;
  rules?: Record<string, RuleDef>;
  ruleContext?: RuleContext;
  storage?: Storage;
};

function resolveRuleDirectives(
  rules: Record<string, RuleDef> | undefined,
  ruleIds: string[] | undefined,
  ctx: RuleContext | undefined,
  match: (effect: RuleEffect) => boolean
): { visible?: boolean; disabled?: boolean } {
  if (!rules || !ctx) return {};
  const list = (ruleIds && ruleIds.length > 0
    ? ruleIds.map((id) => rules[id]).filter(Boolean)
    : Object.values(rules)
  ).filter((r) => r && r.enabled);
  const effects = applyRules(list, ctx);
  const out: { visible?: boolean; disabled?: boolean } = {};
  effects.forEach((eff) => {
    if (!match(eff)) return;
    if (eff.type === "setVisible") out.visible = eff.value;
    if (eff.type === "disable") out.disabled = eff.value;
  });
  return out;
}

export default function Table(props: Props) {
  return safeRender(
    () => {
      const tables = props.tables || {};
      const table = props.tableDefRef ? tables[props.tableDefRef] : props.tableDef;
      if (!table) return <div className="smallMuted">Table non définie</div>;
      const datasources = props.datasources || {};
      const storage = props.storage || window.localStorage;
      const ds = props.datasourceId ? datasources[props.datasourceId] : undefined;
      const rows = ds ? applyQuery(resolveDatasource(ds, storage), props.query) : [];

      const cols = (table.columns || []).filter((c) => {
        const dir = resolveRuleDirectives(
          props.rules,
          c.rules,
          props.ruleContext,
          (eff) =>
            eff.target.type === "column" &&
            (!eff.target.tableId || eff.target.tableId === table.id) &&
            (!eff.target.columnId || eff.target.columnId === c.id)
        );
        if (dir.visible === false) return false;
        if (!c.visibleForRoles || c.visibleForRoles.length === 0) return true;
        return c.visibleForRoles.includes(props.role || "USER_READONLY");
      });

      return (
        <table className="tableX">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.id}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                {cols.map((c) => (
                  <td key={c.id}>{String(r[c.key] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    },
    <div className="smallMuted">Table fallback</div>
  );
}
