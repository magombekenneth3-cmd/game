import { ActiveConversationState } from '../interaction/ConversationSystem';

export class ConversationUI {
  private container: HTMLDivElement;
  private speakerNameElement: HTMLHeadingElement;
  private dialogueTextElement: HTMLParagraphElement;
  private optionsListElement: HTMLUListElement;
  private onResponseSelectedCallback?: (responseId: string) => void;
  private keyListener: (e: KeyboardEvent) => void;
  private activeState: ActiveConversationState | null = null;

  constructor(parent: HTMLElement = document.body) {
    this.container = document.createElement('div');
    this.container.id = 'conversation-ui-modal';
    this.container.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 520px;
      max-width: 90vw;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      padding: 20px 24px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: none;
      flex-direction: column;
      gap: 12px;
    `;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
        <h3 id="conv-speaker-name" style="margin: 0; font-size: 18px; font-weight: 700; color: #38bdf8;">Amina</h3>
        <span id="conv-tone-badge" style="font-size: 11px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">Friendly</span>
      </div>
      <p id="conv-dialogue-text" style="margin: 0; font-size: 15px; line-height: 1.5; color: #e2e8f0; font-style: italic;">
        "Jambo! Welcome to Nairobi."
      </p>
      <ul id="conv-options-list" style="list-style: none; margin: 8px 0 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px;">
      </ul>
      <div style="font-size: 11px; color: #94a3b8; text-align: right; margin-top: 4px;">
        Press <kbd style="background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px;">1-9</kbd> to select or <kbd style="background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px;">Esc</kbd> to exit
      </div>
    `;

    parent.appendChild(this.container);

    this.speakerNameElement = this.container.querySelector('#conv-speaker-name')!;
    this.dialogueTextElement = this.container.querySelector('#conv-dialogue-text')!;
    this.optionsListElement = this.container.querySelector('#conv-options-list')!;

    this.keyListener = (e: KeyboardEvent) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.keyListener);
  }

  public setOnResponseSelected(callback: (responseId: string) => void): void {
    this.onResponseSelectedCallback = callback;
  }

  public update(state: ActiveConversationState | null): void {
    this.activeState = state;

    if (!state) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'flex';
    const npcData = state.npc.state.data;
    this.speakerNameElement.textContent = `${npcData.firstName} ${npcData.lastName} (${npcData.occupation || npcData.archetype})`;

    const toneBadge = this.container.querySelector('#conv-tone-badge');
    if (toneBadge) {
      toneBadge.textContent = state.tone;
    }

    this.dialogueTextElement.textContent = `"${state.currentNode.text}"`;

    this.optionsListElement.innerHTML = '';
    if (state.currentNode.responses) {
      state.currentNode.responses.forEach((resp, idx) => {
        const li = document.createElement('li');
        li.style.cssText = `
          background: rgba(255, 255, 255, 0.06);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        `;
        li.innerHTML = `<span style="background: #0284c7; color: white; width: 20px; height: 20px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${idx + 1}</span> ${resp.text}`;

        li.addEventListener('mouseenter', () => {
          li.style.background = 'rgba(56, 189, 248, 0.2)';
        });
        li.addEventListener('mouseleave', () => {
          li.style.background = 'rgba(255, 255, 255, 0.06)';
        });
        li.addEventListener('click', () => {
          if (this.onResponseSelectedCallback) {
            this.onResponseSelectedCallback(resp.id);
          }
        });

        this.optionsListElement.appendChild(li);
      });
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.activeState || this.container.style.display === 'none') return;

    if (e.key === 'Escape') {
      if (this.onResponseSelectedCallback) {
        this.onResponseSelectedCallback('resp_goodbye');
      }
      return;
    }

    const keyNum = parseInt(e.key, 10);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
      const responses = this.activeState.currentNode.responses || [];
      const selected = responses[keyNum - 1];
      if (selected && this.onResponseSelectedCallback) {
        this.onResponseSelectedCallback(selected.id);
      }
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.keyListener);
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
