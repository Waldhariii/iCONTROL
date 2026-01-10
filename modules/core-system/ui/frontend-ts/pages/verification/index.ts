import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createVerificationModel } from "./model";
import {
  renderVerificationRules,
  renderVerificationSelfcheck,
  renderVerificationSummary
} from "./view";

export function renderVerification(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createVerificationModel();
  const sections: SectionSpec[] = [
    {
      id: "verification-summary",
      title: model.title,
      render: (host) => renderVerificationSummary(host, model)
    },
    {
      id: "verification-selfcheck",
      title: "Selfcheck",
      render: (host) => renderVerificationSelfcheck(host, model)
    },
    {
      id: "verification-rules",
      title: "Rules",
      render: (host) => renderVerificationRules(host, model)
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "verification", role, safeMode });
  });
}

export const verificationSections = [
  "verification-summary",
  "verification-selfcheck",
  "verification-rules"
];
