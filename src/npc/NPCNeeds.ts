import { NPCNeeds, NPCActivityType } from './NPCTypes';

export class NPCNeedsManager {
  public static updateNeeds(needs: NPCNeeds, currentActivity: NPCActivityType, deltaSeconds: number, timeScale: number = 60): void {
    const gameHoursDelta = (deltaSeconds * timeScale) / 3600;

    if (currentActivity === 'SLEEP') {
      needs.energy = Math.min(100, needs.energy + 25 * gameHoursDelta);
    } else {
      needs.energy = Math.max(0, needs.energy - 4 * gameHoursDelta);
    }

    if (currentActivity === 'EAT') {
      needs.hunger = Math.min(100, needs.hunger + 40 * gameHoursDelta);
    } else {
      needs.hunger = Math.max(0, needs.hunger - 6 * gameHoursDelta);
    }

    if (currentActivity === 'SOCIALIZE' || currentActivity === 'CLUB' || currentActivity === 'DATE') {
      needs.social = Math.min(100, needs.social + 30 * gameHoursDelta);
    } else {
      needs.social = Math.max(0, needs.social - 5 * gameHoursDelta);
    }

    if (currentActivity === 'CLUB' || currentActivity === 'CONCERT' || currentActivity === 'EVENT' || currentActivity === 'GYM') {
      needs.entertainment = Math.min(100, needs.entertainment + 35 * gameHoursDelta);
    } else {
      needs.entertainment = Math.max(0, needs.entertainment - 4 * gameHoursDelta);
    }
  }

  public static evaluateUrgentNeed(needs: NPCNeeds): NPCActivityType | null {
    if (needs.energy < 20) return 'SLEEP';
    if (needs.hunger < 25) return 'EAT';
    if (needs.social < 25) return 'SOCIALIZE';
    if (needs.entertainment < 20) return 'EVENT';
    return null;
  }
}
