export type SortDir = "asc" | "desc";
export type SortKey<T> = keyof T;

export function sortBy<T extends Record<string, any>>(rows: T[], key: SortKey<T>, dir: SortDir): T[] {
  const c = [...rows];
  c.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const r = av === bv ? 0 : (av > bv ? 1 : -1);
    return dir === "asc" ? r : -r;
  });
  return c;
}

export function toggleDir(current?: SortDir): SortDir {
  return current === "asc" ? "desc" : "asc";
}
