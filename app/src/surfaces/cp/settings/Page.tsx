import React from "react";
import { enforceCpEntitlementsSurface } from "../../../core/ports/cpSurfaceEnforcement.entitlements";
import { governedRedirect } from "../../../core/runtime/governedRedirect";

export function CpSettingsPage() {
  const [allowed, setAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const result = await enforceCpEntitlementsSurface({ appKind: "CP" });
      if (!alive) return;
      setAllowed(result.allow);
      if (!result.allow) governedRedirect({ kind: "blocked", reason: result.reasonCode });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (allowed !== true) return null;

  return (
    <div className="surface">
      <h1>CP / SETTINGS</h1>
      <p>Surface baseline.</p>
    </div>
  );
}
