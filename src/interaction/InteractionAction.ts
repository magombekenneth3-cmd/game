import { InteractionAction, InteractionActionId } from './InteractionTypes';

export class InteractionActionRegistry {
  private static actions: Map<InteractionActionId, InteractionAction> = new Map();

  public static initialize(): void {
    if (this.actions.size > 0) return;

    this.register({ id: 'TALK', displayName: 'Talk' });
    this.register({ id: 'GREET', displayName: 'Greet' });
    this.register({ id: 'ASK_ABOUT', displayName: 'Ask About...' });
    this.register({ id: 'INTRODUCE_SELF', displayName: 'Introduce Yourself' });
    this.register({ id: 'SAY_GOODBYE', displayName: 'Say Goodbye' });
    this.register({ id: 'FOLLOW', displayName: 'Ask to Follow' });
    this.register({ id: 'STOP_FOLLOWING', displayName: 'Stop Following' });
    this.register({ id: 'ENTER', displayName: 'Enter' });
    this.register({ id: 'EXIT', displayName: 'Exit' });
    this.register({ id: 'USE', displayName: 'Use' });
    this.register({ id: 'INSPECT', displayName: 'Inspect' });

    // Placeholders registered for future phases
    this.register({ id: 'BUY', displayName: 'Buy' });
    this.register({ id: 'SELL', displayName: 'Sell' });
    this.register({ id: 'HIRE', displayName: 'Hire' });
    this.register({ id: 'DATE', displayName: 'Ask Out on Date' });
    this.register({ id: 'THREATEN', displayName: 'Threaten' });
    this.register({ id: 'BRIBE', displayName: 'Bribe' });
    this.register({ id: 'STEAL', displayName: 'Pickpocket' });
    this.register({ id: 'GIVE', displayName: 'Give Item' });
    this.register({ id: 'REQUEST_FAVOR', displayName: 'Request Favor' });
    this.register({ id: 'START_MISSION', displayName: 'Accept Mission' });
  }

  public static register(action: InteractionAction): void {
    this.actions.set(action.id, action);
  }

  public static get(id: InteractionActionId): InteractionAction | undefined {
    this.initialize();
    return this.actions.get(id);
  }

  public static getAll(): InteractionAction[] {
    this.initialize();
    return Array.from(this.actions.values());
  }
}
