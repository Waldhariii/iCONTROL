export type Surface = "cp" | "client";

export interface PageDefinition {
  id: string;
  surface: Surface;
  key: string;
  slug: string;
  title_key: string;
  module_id: string;
  default_layout_template_id: string;
  capabilities_required: string[];
  owner_team: string;
  tags: string[];
  state: "active" | "deprecated";
}
