import { VehicleType } from '../vehicles/VehicleTypes';
import { SeededRandom } from '../utils/SeededRandom';

export class TrafficDensity {
  public static getDensityFactorForTime(hours: number): number {
    const normalizedHours = (hours % 24 + 24) % 24;

    if (normalizedHours >= 6.0 && normalizedHours < 9.0) {
      // Morning Rush Hour Peak
      return 1.0;
    } else if (normalizedHours >= 9.0 && normalizedHours < 16.0) {
      // Daytime Moderate Flow
      return 0.6;
    } else if (normalizedHours >= 16.0 && normalizedHours < 19.0) {
      // Evening Rush Hour Peak
      return 0.95;
    } else if (normalizedHours >= 19.0 && normalizedHours < 23.0) {
      // Nightlife & Social Moderate Flow
      return 0.45;
    } else {
      // Late Night Low Flow (23:00 - 05:00)
      return 0.15;
    }
  }

  public static selectVehicleType(rng: SeededRandom, isMatatuRoute: boolean = false): VehicleType {
    if (isMatatuRoute && rng.nextFloat() < 0.6) {
      return 'matatu';
    }

    const val = rng.nextFloat();
    if (val < 0.35) return 'sedan';
    if (val < 0.60) return 'compact_car';
    if (val < 0.75) return 'suv';
    if (val < 0.85) return 'matatu';
    if (val < 0.90) return 'pickup';
    if (val < 0.95) return 'van';
    if (val < 0.98) return 'motorcycle';
    return 'truck';
  }
}
