export type AccountModel = {
  title: string;
  description: string;
};

export function createAccountModel(): AccountModel {
  return {
    title: "Compte",
    description: "Gestion du compte et preferences.",
  };
}
