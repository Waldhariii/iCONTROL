export type UsersModel = {
  title: string;
  items: string[];
};

export function createUsersModel(): UsersModel {
  return {
    title: "Utilisateurs",
    items: ["Admin", "Sysadmin", "Developer"],
  };
}
