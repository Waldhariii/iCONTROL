import type { RankMap } from "./types";

/** Higher number = higher privilege. */
export const roleRank: RankMap = {
  SYSADMIN: 4,
  DEVELOPER: 3,
  ADMIN: 2,
  USER_READONLY: 1,
} as const;
