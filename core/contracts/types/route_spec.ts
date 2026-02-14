export type Surface = "cp" | "client";

export interface RouteSpec {
  route_id: string;
  surface: Surface;
  path: string;
  page_id: string;
  guard_pack_id: string;
  flag_gate_id: string;
  entitlement_gate_id: string;
  priority: number;
  canonical: boolean;
  aliases: string[];
  deprecation_date: string;
  redirect_to: string;
}
