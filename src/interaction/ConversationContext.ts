import { NPCData, NPCPersonality } from '../npc/NPCTypes';
import { RelationshipState, NPCTone } from './InteractionTypes';
import { SeededRandom } from '../utils/SeededRandom';

export class ConversationContextManager {
  public static determineNPCTone(
    personality: NPCPersonality,
    relationship?: RelationshipState,
    worldSeed: number = 1337,
    interactionCount: number = 0
  ): NPCTone {
    const affinity = relationship ? relationship.affinity : 0;

    // High affinity / familiarity yields friendly or enthusiastic
    if (affinity >= 40) {
      return personality.sociability > 0.6 ? 'enthusiastic' : 'friendly';
    }

    // Negative affinity yields suspicious or reserved
    if (affinity <= -20) {
      return personality.riskTolerance < 0.4 ? 'suspicious' : 'reserved';
    }

    // Default neutral/personality influence
    if (personality.friendliness > 0.7) return 'friendly';
    if (personality.sociability < 0.3) return 'reserved';

    const rng = new SeededRandom(worldSeed + Math.floor(affinity) + interactionCount * 17);
    const roll = rng.nextFloat();
    return roll < 0.5 ? 'neutral' : 'friendly';
  }

  public static formatGreeting(
    npcData: NPCData,
    tone: NPCTone,
    relationship?: RelationshipState
  ): string {
    const name = npcData.firstName;
    const isFriend = (relationship?.affinity || 0) > 30;

    switch (tone) {
      case 'enthusiastic':
        return isFriend
          ? `Habari gani, my friend! Great to see you again!`
          : `Jambo! Welcome! I'm ${name}, fantastic to meet you!`;

      case 'friendly':
        return isFriend
          ? `Mambo! Good to see you around, my friend.`
          : `Hujambo! I'm ${name}. How are you doing today?`;

      case 'reserved':
        return `Niaje. I'm ${name}. What can I do for you?`;

      case 'suspicious':
        return `Who are you? State your business quickly.`;

      case 'neutral':
      default:
        return `Sasa. I'm ${name}, working around Kilimani. What's up?`;
    }
  }
}
