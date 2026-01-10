import type { SystemModel } from "../model";
import { blockToggle } from "../../_shared/uiBlocks";
import { updateFlag } from "../model";

export function renderSystemFlags(host: HTMLElement, model: SystemModel): void {
  model.flags.forEach((flag) => {
    host.appendChild(
      blockToggle({
        id: `flag_${flag.id}`,
        label: flag.label,
        description: flag.disabledBySafeMode
          ? `${flag.description} (SAFE_MODE force OFF)`
          : flag.description,
        checked: flag.value,
        disabled: flag.disabledBySafeMode,
        onChange: (next) => updateFlag(flag.id, next)
      })
    );
  });
}
