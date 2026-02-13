import { createPageShell } from "../../../../core/ui/pageShell";
import { createSectionCard } from "../../../../core/ui/sectionCard";

export function render(root: HTMLElement): void {
  const shell = createPageShell({
    title: "System - TITLE_HERE",
    subtitle: "DESCRIPTION_HERE",
  });

  const card = createSectionCard({
    title: "Coming Soon",
    content: "<p>Cette page est en construction.</p>",
  });

  shell.appendChild(card);
  root.innerHTML = "";
  root.appendChild(shell);
}
