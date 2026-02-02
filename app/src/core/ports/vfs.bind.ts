import type { VfsPort } from "../../../../core-kernel/src/contracts/vfsPort.contract";
import { bindVfsPort } from "./vfs.facade";

export type VfsFactory = () => VfsPort;

/** Boundary-safe binder: adapters provide concrete impl via factory. */
export function bindVfs(factory: VfsFactory): void {
  bindVfsPort(factory());
}
