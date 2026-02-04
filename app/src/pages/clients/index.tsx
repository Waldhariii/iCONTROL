import React from "react";

// SSOT: Clients page entrypoint.
// This file must stay import-safe and stable for contracts.
// Canonical UI lives in surfaces/app/clients/Page.tsx.
import SurfaceClientsPage from "../../surfaces/app/clients/Page";

export default function ClientsPage() {
  return <SurfaceClientsPage />;
}
