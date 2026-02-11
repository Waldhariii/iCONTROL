import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

export function usePoliciesCommands() {
  const writeGateway = useWriteGateway();

  const createPolicy = async (payload: { id?: string; name: string; status: string }) => {
    return writeGateway.execute({ type: "POLICY_CREATE", payload });
  };

  const updatePolicy = async (payload: { id: string; name: string; status: string }) => {
    return writeGateway.execute({ type: "POLICY_UPDATE", payload });
  };

  const deletePolicy = async (payload: { id: string }) => {
    return writeGateway.execute({ type: "POLICY_DELETE", payload });
  };

  return { createPolicy, updatePolicy, deletePolicy };
}
