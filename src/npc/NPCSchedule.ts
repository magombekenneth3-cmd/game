import { NPCScheduleEntry, NPCArchetype, NPCPersonality } from './NPCTypes';

export class NPCScheduleGenerator {
  public static generateSchedule(_seed: number, archetype: NPCArchetype, personality: NPCPersonality): NPCScheduleEntry[] {
    const isNightlifeFan = personality.nightlifePreference > 0.6;

    switch (archetype) {
      case 'student':
        return [
          { startHour: 0.0, endHour: 7.0, activityType: 'SLEEP', preferredDestinationTag: 'residential' },
          { startHour: 7.0, endHour: 8.5, activityType: 'EAT', preferredDestinationTag: 'residential' },
          { startHour: 8.5, endHour: 15.5, activityType: 'WORK', preferredDestinationTag: 'educational' },
          { startHour: 15.5, endHour: 18.5, activityType: 'SOCIALIZE', preferredDestinationTag: 'park' },
          { startHour: 18.5, endHour: 21.0, activityType: 'EAT', preferredDestinationTag: 'commercial' },
          { startHour: 21.0, endHour: 24.0, activityType: isNightlifeFan ? 'CLUB' : 'HOME', preferredDestinationTag: isNightlifeFan ? 'nightlife' : 'residential' }
        ];

      case 'young_professional':
        return [
          { startHour: 0.0, endHour: 6.5, activityType: 'SLEEP', preferredDestinationTag: 'residential' },
          { startHour: 6.5, endHour: 7.5, activityType: 'EAT', preferredDestinationTag: 'residential' },
          { startHour: 7.5, endHour: 17.5, activityType: 'WORK', preferredDestinationTag: 'office' },
          { startHour: 17.5, endHour: 19.5, activityType: 'GYM', preferredDestinationTag: 'commercial' },
          { startHour: 19.5, endHour: 22.0, activityType: isNightlifeFan ? 'CLUB' : 'EAT', preferredDestinationTag: isNightlifeFan ? 'nightlife' : 'commercial' },
          { startHour: 22.0, endHour: 24.0, activityType: 'HOME', preferredDestinationTag: 'residential' }
        ];

      case 'musician':
      case 'artist':
        return [
          { startHour: 0.0, endHour: 3.0, activityType: 'CLUB', preferredDestinationTag: 'nightlife' },
          { startHour: 3.0, endHour: 11.0, activityType: 'SLEEP', preferredDestinationTag: 'residential' },
          { startHour: 11.0, endHour: 16.0, activityType: 'WORK', preferredDestinationTag: 'commercial' },
          { startHour: 16.0, endHour: 21.0, activityType: 'CONCERT', preferredDestinationTag: 'entertainment' },
          { startHour: 21.0, endHour: 24.0, activityType: 'CLUB', preferredDestinationTag: 'nightlife' }
        ];

      case 'office_worker':
      default:
        return [
          { startHour: 0.0, endHour: 6.0, activityType: 'SLEEP', preferredDestinationTag: 'residential' },
          { startHour: 6.0, endHour: 7.30, activityType: 'EAT', preferredDestinationTag: 'residential' },
          { startHour: 7.30, endHour: 17.0, activityType: 'WORK', preferredDestinationTag: 'office' },
          { startHour: 17.0, endHour: 19.0, activityType: 'SHOP', preferredDestinationTag: 'commercial' },
          { startHour: 19.0, endHour: 24.0, activityType: 'HOME', preferredDestinationTag: 'residential' }
        ];
    }
  }

  public static getActivityForTime(schedule: NPCScheduleEntry[], hours: number): NPCScheduleEntry {
    const normHours = ((hours % 24) + 24) % 24;
    for (const entry of schedule) {
      if (entry.startHour <= entry.endHour) {
        if (normHours >= entry.startHour && normHours < entry.endHour) return entry;
      } else {
        // Crosses midnight (e.g. 21:00 to 03:00)
        if (normHours >= entry.startHour || normHours < entry.endHour) return entry;
      }
    }
    return schedule[0];
  }
}
