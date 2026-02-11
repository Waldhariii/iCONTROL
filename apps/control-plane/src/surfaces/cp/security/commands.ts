import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

export function useSecurityCommands() {
  const writeGateway = useWriteGateway();

  const updateSecurity = async (payload: { id: string; name: string; status: string }) => {
    return writeGateway.execute({ type: "SECURITY_UPDATE", payload });
  };

  const deleteSecurity = async (payload: { id: string }) => {
    return writeGateway.execute({ type: "SECURITY_DELETE", payload });
  };

  return { updateSecurity, deleteSecurity };
}
