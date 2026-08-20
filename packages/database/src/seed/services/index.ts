import type { DepartmentSeed, ServiceSeed, SourceSeed } from "../types.js";
import { departments } from "./departments.js";
import { sources } from "./sources.js";
import { transportServices } from "./transport.js";
import { landServices } from "./land.js";
import { policeServices } from "./police.js";
import { municipalServices } from "./municipal.js";
import { revenueServices } from "./revenue.js";
import { commerceServices } from "./commerce.js";

export const allDepartments: DepartmentSeed[] = departments;

export const allSources: SourceSeed[] = sources;

// 12 real government services across transport, land, police, municipal,
// revenue and commerce.
export const allServices: ServiceSeed[] = [
  ...transportServices,
  ...landServices,
  ...policeServices,
  ...municipalServices,
  ...revenueServices,
  ...commerceServices,
];
