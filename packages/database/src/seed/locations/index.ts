import type { StateSeed } from "../types.js";
import { northStates } from "./north.js";
import { southStates } from "./south.js";
import { eastStates } from "./east.js";
import { westStates } from "./west.js";
import { centralStates } from "./central.js";

// All 28 states + 8 union territories, with real districts and headquarters
// cities. Combined here so the seed runner (../index.ts) imports a single list.
export const allStates: StateSeed[] = [
  ...northStates,
  ...southStates,
  ...eastStates,
  ...westStates,
  ...centralStates,
];
