import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

export function useBrandingCommands() {
  const writeGateway = useWriteGateway();

  const updateBranding = async (payload: { logo_url: string; primary_color: string }) => {
    return writeGateway.execute({ type: "BRANDING_UPDATE", payload });
  };

  return { updateBranding };
}
