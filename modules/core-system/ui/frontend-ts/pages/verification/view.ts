import type { VerificationModel } from "./model";

export function renderVerificationView(root: HTMLElement, model: VerificationModel): void {
  const items = model.items
    .map((item) => {
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #2a2a2a;">${item.id}</td>
        <td style="padding:8px;border-bottom:1px solid #2a2a2a;">${item.subject}</td>
        <td style="padding:8px;border-bottom:1px solid #2a2a2a;">${item.status}</td>
      </tr>`;
    })
    .join("");

  root.innerHTML = [
    `<section style="max-width:980px;margin:24px auto;padding:0 16px;">`,
    `<h1 style="margin:0 0 12px 0;">${model.title}</h1>`,
    `<p style="opacity:0.7;margin:0 0 16px 0;">Audit trail for verification requests.</p>`,
    `<table style="width:100%;border-collapse:collapse;">`,
    `<thead>`,
    `<tr>`,
    `<th style="text-align:left;padding:8px;border-bottom:1px solid #444;">ID</th>`,
    `<th style="text-align:left;padding:8px;border-bottom:1px solid #444;">Sujet</th>`,
    `<th style="text-align:left;padding:8px;border-bottom:1px solid #444;">Statut</th>`,
    `</tr>`,
    `</thead>`,
    `<tbody>${items}</tbody>`,
    `</table>`,
    `</section>`
  ].join("");
}
