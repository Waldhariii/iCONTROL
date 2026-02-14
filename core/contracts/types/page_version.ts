export interface PageVersion {
  page_id: string;
  version: string;
  status: "draft" | "released";
  layout_instance_id: string;
  widget_instance_ids: string[];
  nav_binding_ids: string[];
  design_version_lock: string;
  checksum: string;
  rollback_ref: string;
  created_by: string;
  created_at: string;
  diff_ref: string;
}
