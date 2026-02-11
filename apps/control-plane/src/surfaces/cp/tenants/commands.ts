import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

export function useTenantsCommands() {
  const writeGateway = useWriteGateway();

  const createTenant = async (payload: Record<string, unknown>) => {
    await writeGateway.execute({
      type: "TENANT_CREATE",
      payload,
    });
  };

  const updateTenant = async (payload: Record<string, unknown>) => {
    return writeGateway.execute({
      type: "TENANT_UPDATE",
      payload,
    });
  };

  const deleteTenant = async (payload: { id: string }) => {
    return writeGateway.execute({
      type: "TENANT_DELETE",
      payload,
    });
  };

  return { createTenant, updateTenant, deleteTenant };
}
