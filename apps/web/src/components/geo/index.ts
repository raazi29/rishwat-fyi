/**
 * Barrel for the geographic feature module shared by /map, /states and
 * /departments. Import from `@/components/geo`.
 */

export { MetricSwitcher } from "./metric-switcher";
export { StateMetricMap } from "./state-metric-map";
export { StateTable } from "./state-table";
export { StateList, STATE_SORTS, readStateSort, type StateSort } from "./state-list";
export { DistrictList } from "./district-list";
export { DepartmentGroupList, type DepartmentSummary } from "./department-list";
export { ServiceComparisonTable } from "./service-comparison-table";
export { StateServiceTable } from "./state-service-table";
export { RegionGroup } from "./region-group";
export { NotEnoughData } from "./not-enough-data";

export {
  DEFAULT_STATE_METRIC,
  STATE_METRICS,
  formatMetricValue,
  metricValue,
  rankStates,
  readStateMetric,
  stateMetricConfig,
  type StateMetric,
  type StateMetricConfig,
} from "./state-metric";

export {
  REGION_ORDER,
  regionLabel,
  regionOf,
  type Region,
} from "./regions";
