import React from "react";

export function ListMetierV2({ rows }: {
  rows: { id: string; label: string; value: string }[];
}) {
  return (
    <table width="100%">
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td align="right">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
