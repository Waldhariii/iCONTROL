import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

export function useProvidersCommands() {
  const writeGateway = useWriteGateway();

  const createProvider = async (payload: {
    id?: string;
    name: string;
    type: string;
    status: string;
    health_status?: string;
    fallback_provider_id?: string;
    config_json?: string;
  }) => {
    return writeGateway.execute({ type: "PROVIDER_CREATE", payload });
  };

  const updateProvider = async (payload: {
    id: string;
    name: string;
    type: string;
    status: string;
    health_status?: string;
    fallback_provider_id?: string;
    config_json?: string;
  }) => {
    return writeGateway.execute({ type: "PROVIDER_UPDATE", payload });
  };

  const deleteProvider = async (payload: { id: string }) => {
    return writeGateway.execute({ type: "PROVIDER_DELETE", payload });
  };

  return { createProvider, updateProvider, deleteProvider };
}
