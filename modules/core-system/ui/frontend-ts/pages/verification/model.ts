export type VerificationItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  subject: string;
};

export type VerificationModel = {
  title: string;
  items: VerificationItem[];
};

export function createVerificationModel(): VerificationModel {
  return {
    title: "Verification",
    items: [
      { id: "ver-001", status: "pending", subject: "Onboarding company" },
      { id: "ver-002", status: "approved", subject: "Billing profile" }
    ]
  };
}
