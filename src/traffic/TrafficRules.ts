export interface TrafficRules {
  trafficSide: 'LEFT' | 'RIGHT';
  obeySignals: boolean;
  obeyStopSigns: boolean;
  obeyYieldSigns: boolean;
  defaultFollowingDistance: number;
}

export const NAIROBI_TRAFFIC_RULES: TrafficRules = {
  trafficSide: 'LEFT',
  obeySignals: true,
  obeyStopSigns: true,
  obeyYieldSigns: true,
  defaultFollowingDistance: 5.0
};
