import { InteractionMemory } from './InteractionTypes';

export class InteractionMemoryManager {
  private memories: Map<string, InteractionMemory> = new Map();

  public getMemory(npcId: string): InteractionMemory {
    if (!this.memories.has(npcId)) {
      this.memories.set(npcId, {
        interactionCount: 0,
        lastInteractionTime: 0,
        lastInteractionType: 'NONE',
        positiveInteractions: 0,
        negativeInteractions: 0,
        topicsDiscussed: []
      });
    }
    return this.memories.get(npcId)!;
  }

  public recordInteraction(
    npcId: string,
    interactionType: string,
    timeOfDay: number,
    isPositive: boolean = true,
    topic?: string
  ): InteractionMemory {
    const memory = this.getMemory(npcId);
    memory.interactionCount++;
    memory.lastInteractionTime = timeOfDay;
    memory.lastInteractionType = interactionType;

    if (isPositive) {
      memory.positiveInteractions++;
    } else {
      memory.negativeInteractions++;
    }

    if (topic && !memory.topicsDiscussed.includes(topic)) {
      memory.topicsDiscussed.push(topic);
    }

    return memory;
  }

  public setMemory(npcId: string, memory: InteractionMemory): void {
    this.memories.set(npcId, memory);
  }

  public clear(): void {
    this.memories.clear();
  }
}
