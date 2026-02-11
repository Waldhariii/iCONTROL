// @ts-nocheck
import {
  MAIN_SYSTEM_DATASOURCES,
  MAIN_SYSTEM_FORM_CONTRACT,
  MAIN_SYSTEM_TABLE_CONTRACT
} from "../_shared/mainSystem.data";

export type DeveloperModel = {
  title: string;
  notes: string[];
  tableContract: typeof MAIN_SYSTEM_TABLE_CONTRACT;
  formContract: typeof MAIN_SYSTEM_FORM_CONTRACT;
  datasource: typeof MAIN_SYSTEM_DATASOURCES;
};

export function createDeveloperModel(): DeveloperModel {
  return {
    title: "Developpeur",
    notes: ["Toolbox", "Tables", "Forms", "Datasources"],
    tableContract: MAIN_SYSTEM_TABLE_CONTRACT,
    formContract: MAIN_SYSTEM_FORM_CONTRACT,
    datasource: MAIN_SYSTEM_DATASOURCES
  };
}
