/**
 * Attack Surface Module
 *
 * Pure functions and configuration for attack surface analysis.
 */

// Config exports
export {
  RISK_THRESHOLDS,
  RISK_LEVELS,
  PORT_CATEGORIES,
  RISK_FILTER_TOOLTIPS,
  FILTER_MODE_CONFIG,
  RISK_FILTER_CONFIG,
  THEME_VARS,
  getKnownPorts,
  getOtherGrpcPorts,
} from './config';

// Stats exports
export { calculateStats, emptyStats } from './stats';

// Type exports
export type {
  RiskLevel,
  OsintReputation,
  RiskInput,
  RiskResult,
  PortCategorization,
  AttackSurfaceNode,
  SortOptions,
  SortColumn,
  SortDirection,
  NodeSortStage,
  FilterMode,
  RiskFilter,
  AttackSurfaceStats,
} from './types';

// Risk assessment exports
export {
  assessRisk,
  formatRiskTooltip,
  getRiskSortValue,
} from './risk-assessment';

// Port categorization exports
export {
  categorizePorts,
  getPortLegend,
} from './port-categories';

// Sorting exports
export {
  compareIpAddresses,
  sortAttackSurfaceNodes,
  filterAttackSurfaceNodes,
  getNodeSortIndicator,
  getNextNodeSortStage,
} from './sorting';
