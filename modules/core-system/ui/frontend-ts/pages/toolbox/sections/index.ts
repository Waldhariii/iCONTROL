import type { ToolboxSection } from "../contracts";
import { diagnosticsSection } from "./diagnostics";
import { pipelineSection } from "./pipeline";
import { logsSection } from "./logs";
import { apiToolsSection } from "./api-tools";
import { webhooksSection } from "./webhooks";
import { tokensSection } from "./tokens";

export const TOOLBOX_SECTIONS: ToolboxSection[] = [
  diagnosticsSection,
  pipelineSection,
  logsSection,
  apiToolsSection,
  webhooksSection,
  tokensSection
];
