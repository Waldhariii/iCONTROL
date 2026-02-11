// @ts-nocheck
export type SurfaceStatus = "idle" | "loading" | "error" | "ready";

export type SurfaceVM = {
  status: SurfaceStatus;
  title: string;
};

export function makeSurfaceVM(title: string): SurfaceVM {
  return { status: "ready", title };
}
