/**
 * Barrel for the UI primitive layer. Import primitives from `@/components/ui`
 * rather than deep paths. Button, ButtonLink, and ActionLink are re-exported
 * from the pre-existing `./button` so callers have a single entry point.
 */

// Buttons (pre-existing module)
export { Button, ButtonLink, ActionLink } from "./button";
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize } from "./button";

// Surfaces
export {
  Card,
  Panel,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  SectionHeading,
  Divider,
  IconTile,
} from "./surface";

// Badges & chips
export { Badge, VerificationBadge, Chip } from "./badge";
export type { BadgeTone, ChipTone } from "./badge";

// Form fields
export {
  Field,
  TextInput,
  Textarea,
  NativeSelect,
  Checkbox,
  Radio,
  RadioGroup,
} from "./field";
export type { FieldControlProps, RadioOption } from "./field";

// Search composite
export { SearchField } from "./search-field";

// Custom controls (dependency-free select + combobox)
export { CustomSelect } from "./custom-select";
export type { CustomSelectProps } from "./custom-select";
export { Combobox } from "./combobox";
export type { ComboboxProps } from "./combobox";
export { SelectOverlay, SHEET_MEDIA_QUERY } from "./select-overlay";
export type { SelectOverlayProps } from "./select-overlay";
export { OptionList } from "./option-list";
export type { OptionListProps } from "./option-list";
export {
  filterOptions,
  optionMatchesQuery,
  foldForSearch,
  indexOfValue,
  firstEnabledIndex,
  lastEnabledIndex,
  stepEnabledIndex,
  typeaheadIndex,
  isTypeaheadKey,
  isAriaInvalid,
  optionDomId,
} from "./select-types";
export type { SelectOption, BaseSelectProps } from "./select-types";

// Table primitives
export { TableShell, THead, Th, Td, NumericTd, RowLink } from "./table";

// Tabs
export { Tabs } from "./tabs";
export type { TabItem } from "./tabs";

// Steps & progress
export { Steps, ProgressBar } from "./steps";
export type { StepItem } from "./steps";

// Callouts & strips
export { Callout, NoticeStrip, SampleDataStrip, MANDATORY_NOTICE } from "./callout";
export type { CalloutTone } from "./callout";

// Loading / empty / error
export { Skeleton, EmptyState, ThresholdEmptyState, ErrorState } from "./feedback";

// Pagination
export { Pagination, ResultCount } from "./pagination";

// Breadcrumbs
export { Breadcrumbs } from "./breadcrumbs";
export type { Crumb } from "./breadcrumbs";

// Figures
export { Figure, StatStrip, DeltaFigure } from "./figure";
export type { FigureTone, FigureSize, StatItem } from "./figure";

// Tooltip
export { Tooltip } from "./tooltip";

// Copy button
export { CopyButton } from "./copy-button";
