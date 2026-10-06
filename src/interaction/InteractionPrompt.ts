import { InteractionAction, InteractionTarget } from './InteractionTypes';

export interface ComprehensiveInteractionPromptState {
  hasTarget: boolean;
  target?: InteractionTarget;
  displayName: string;
  distanceMeters: number;
  primaryAction?: InteractionAction;
  availableActions: InteractionAction[];
}

export class InteractionPromptManager {
  public static buildPrompt(
    target: InteractionTarget | undefined,
    distanceMeters: number,
    actions: InteractionAction[]
  ): ComprehensiveInteractionPromptState {
    return {
      hasTarget: !!target,
      target,
      displayName: target ? target.displayName : '',
      distanceMeters: parseFloat(distanceMeters.toFixed(1)),
      primaryAction: actions.length > 0 ? actions[0] : undefined,
      availableActions: actions
    };
  }
}
