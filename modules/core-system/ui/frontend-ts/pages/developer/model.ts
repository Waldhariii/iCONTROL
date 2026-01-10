export type DeveloperModel = {
  title: string;
  notes: string[];
};

export function createDeveloperModel(): DeveloperModel {
  return {
    title: "Developpeur",
    notes: ["API tokens", "Diagnostics", "Sandbox"],
  };
}
