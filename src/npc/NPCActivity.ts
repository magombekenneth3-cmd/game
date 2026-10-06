import { NPCData, NPCActivityType, ActivityDestination } from './NPCTypes';
import { NPCScheduleGenerator } from './NPCSchedule';
import { NPCNeedsManager } from './NPCNeeds';
import { NPCPersonalityGenerator } from './NPCPersonality';

export class NPCActivityPlanner {
  private destinations: Map<string, ActivityDestination> = new Map();

  public registerDestination(destination: ActivityDestination): void {
    this.destinations.set(destination.id, destination);
  }

  public planNextActivity(npc: NPCData, currentHours: number): {
    activityType: NPCActivityType;
    targetDestination?: ActivityDestination;
  } {
    // 1. Check for Urgent Survival Needs (Energy < 20 -> SLEEP, Hunger < 25 -> EAT)
    const urgentNeed = NPCNeedsManager.evaluateUrgentNeed(npc.needs);
    let chosenActivity: NPCActivityType = urgentNeed || 'HOME';

    if (!urgentNeed) {
      // 2. Lookup Scheduled Activity for Current Time of Day
      const scheduledEntry = NPCScheduleGenerator.getActivityForTime(npc.schedule, currentHours);
      chosenActivity = scheduledEntry.activityType;

      // 3. Weight against Personality (e.g. Nightlife preference boosting CLUB / CONCERT at night)
      const prefScore = NPCPersonalityGenerator.evaluateActivityPreference(npc.personality, chosenActivity, currentHours);
      if (prefScore > 1.5 && (currentHours >= 21.0 || currentHours < 4.0) && npc.personality.nightlifePreference > 0.6) {
        chosenActivity = 'CLUB';
      }
    }

    // 4. Match Activity Destination
    const targetDestination = this.findBestDestination(npc, chosenActivity);

    return {
      activityType: chosenActivity,
      targetDestination
    };
  }

  public findBestDestination(npc: NPCData, activity: NPCActivityType): ActivityDestination | undefined {
    let bestDest: ActivityDestination | undefined;
    let minDistanceSq = Infinity;

    this.destinations.forEach((dest) => {
      if (dest.activities.includes(activity)) {
        const distSq = npc.homeLocation.distanceToSquared(dest.position);
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestDest = dest;
        }
      }
    });

    return bestDest;
  }
}
