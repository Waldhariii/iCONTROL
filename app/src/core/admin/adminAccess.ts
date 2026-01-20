export type AdminRole =
  | "OWNER"
  | "ADMIN"
  | "AUDITOR";

export function hasAdminAccess(role: AdminRole): boolean {
  // Dormant logic — default OWNER only
  return role === "OWNER";
}
