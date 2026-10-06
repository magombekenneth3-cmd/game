import { InteractionContext, InteractionAction, InteractionActionId } from './InteractionTypes';
import { InteractionActionRegistry } from './InteractionAction';

export class InteractionResolver {
  public static resolveAvailableActions(context: InteractionContext): InteractionAction[] {
    const actionIds: InteractionActionId[] = [];

    switch (context.targetType) {
      case 'NPC': {
        const rel = context.relationship;
        const familiarity = rel ? rel.familiarity : 0;
        const affinity = rel ? rel.affinity : 0;

        if (familiarity < 10 && affinity < 20) {
          // Unknown NPC
          actionIds.push('GREET', 'INTRODUCE_SELF');
        } else if (familiarity >= 50 || affinity >= 50) {
          // Close friend / Known ally
          actionIds.push('GREET', 'TALK', 'ASK_ABOUT', 'FOLLOW', 'SAY_GOODBYE');
        } else {
          // Known NPC
          actionIds.push('GREET', 'TALK', 'ASK_ABOUT', 'SAY_GOODBYE');
        }
        break;
      }

      case 'DOOR':
        actionIds.push('ENTER', 'EXIT');
        break;

      case 'VEHICLE':
        actionIds.push('ENTER', 'EXIT');
        break;

      case 'OBJECT':
        actionIds.push('USE', 'INSPECT');
        break;

      case 'LOCATION':
        actionIds.push('INSPECT');
        break;
    }

    return actionIds
      .map((id) => InteractionActionRegistry.get(id))
      .filter((action): action is InteractionAction => action !== undefined);
  }
}
