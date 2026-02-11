import type { VfsPort } from "../contracts/vfsPort.contract";

let _vfs: VfsPort | null = null;

export function bindVfsPort(port: VfsPort): void {
  _vfs = port;
}

export function getVfsPort(): VfsPort {
  if (!_vfs) throw new Error("ERR_VFS_NOT_BOUND");
  return _vfs;
}
