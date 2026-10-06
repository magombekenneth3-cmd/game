import { NPCPersonality, NPCArchetype, NPCActivityType } from './NPCTypes';
import { SeededRandom } from '../utils/SeededRandom';

export class NPCPersonalityGenerator {
  public static generate(seed: number, archetype: NPCArchetype): NPCPersonality {
    const rng = new SeededRandom(seed);

    let baseSociability = 0.5;
    let baseAmbition = 0.5;
    let baseRisk = 0.5;
    let baseNightlife = 0.5;
    let baseFriendliness = 0.6;
    let baseDiscipline = 0.5;

    switch (archetype) {
      case 'student':
        baseSociability = 0.8;
        baseNightlife = 0.85;
        baseRisk = 0.7;
        baseDiscipline = 0.4;
        break;
      case 'young_professional':
        baseAmbition = 0.85;
        baseSociability = 0.75;
        baseNightlife = 0.7;
        baseDiscipline = 0.7;
        break;
      case 'office_worker':
        baseDiscipline = 0.8;
        baseNightlife = 0.35;
        baseRisk = 0.3;
        break;
      case 'musician':
      case 'artist':
        baseNightlife = 0.9;
        baseSociability = 0.85;
        baseRisk = 0.8;
        baseDiscipline = 0.3;
        break;
      case 'business_owner':
        baseAmbition = 0.9;
        baseDiscipline = 0.85;
        baseSociability = 0.8;
        break;
      case 'security_guard':
        baseDiscipline = 0.85;
        baseNightlife = 0.2;
        baseRisk = 0.4;
        break;
    }

    return {
      sociability: parseFloat(Math.min(1.0, Math.max(0.1, baseSociability + rng.nextRange(-0.15, 0.15))).toFixed(2)),
      ambition: parseFloat(Math.min(1.0, Math.max(0.1, baseAmbition + rng.nextRange(-0.15, 0.15))).toFixed(2)),
      riskTolerance: parseFloat(Math.min(1.0, Math.max(0.1, baseRisk + rng.nextRange(-0.15, 0.15))).toFixed(2)),
      nightlifePreference: parseFloat(Math.min(1.0, Math.max(0.1, baseNightlife + rng.nextRange(-0.15, 0.15))).toFixed(2)),
      friendliness: parseFloat(Math.min(1.0, Math.max(0.1, baseFriendliness + rng.nextRange(-0.15, 0.15))).toFixed(2)),
      discipline: parseFloat(Math.min(1.0, Math.max(0.1, baseDiscipline + rng.nextRange(-0.15, 0.15))).toFixed(2))
    };
  }

  public static evaluateActivityPreference(personality: NPCPersonality, activity: NPCActivityType, hours: number): number {
    let score = 1.0;
    const isNight = hours >= 21.0 || hours < 4.0;

    if (activity === 'CLUB' || activity === 'CONCERT') {
      score *= (0.3 + personality.nightlifePreference * 1.7);
      if (isNight) score *= 2.5;
      else score *= 0.1; // Rarely club during daytime
    } else if (activity === 'SOCIALIZE') {
      score *= (0.4 + personality.sociability * 1.4);
    } else if (activity === 'WORK') {
      score *= (0.5 + personality.discipline * 1.0 + personality.ambition * 0.5);
      if (isNight) score *= 0.2; // Office work decreases at night
    } else if (activity === 'SLEEP') {
      if (hours >= 23.0 || hours < 6.0) score *= (1.5 + (1.0 - personality.nightlifePreference));
    }

    return score;
  }
}
