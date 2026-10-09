import { PlayerStateMode } from '../player/PlayerTypes';
import { InteractionPromptState } from '../player/InteractionSystem';

export class HUDOverlay {
  private container: HTMLDivElement;
  private promptCard: HTMLDivElement;
  private cashDisplay: HTMLSpanElement;
  private repDisplay: HTMLSpanElement;
  private stateBadge: HTMLSpanElement;
  private staminaBar: HTMLDivElement;

  private drivingWidget: HTMLDivElement;
  private kphDisplay: HTMLSpanElement;
  private drivingStateBadge: HTMLSpanElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-overlay';

    this.container.innerHTML = `
      <!-- Top Left Player Stats Widget -->
      <div class="hud-player-widget">
        <div class="hud-stat-box">
          <span class="hud-label">CASH</span>
          <span id="hud-cash" class="hud-value cash">KSh 2,500</span>
        </div>
        <div class="hud-stat-box">
          <span class="hud-label">REPUTATION</span>
          <span id="hud-rep" class="hud-value rep">⭐ 10</span>
        </div>
        <div class="hud-stat-box">
          <span id="hud-state-badge" class="badge state-idle">IDLE</span>
        </div>
        <div class="stamina-track">
          <div id="hud-stamina-bar" class="stamina-fill"></div>
        </div>
      </div>

      <!-- Driving Telemetry Widget -->
      <div id="hud-driving-widget" class="hud-driving-widget hidden" style="position: absolute; bottom: 25px; left: 25px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); color: #fff; font-family: sans-serif; display: flex; align-items: center; gap: 16px;">
        <div class="hud-stat-box">
          <span id="hud-kph" class="hud-value kph" style="font-size: 24px; font-weight: bold; color: #38bdf8;">0 KPH</span>
        </div>
        <div class="hud-stat-box">
          <span id="hud-driving-state" class="badge state-driving" style="background: #0284c7; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">DRIVING</span>
        </div>
        <div class="hud-stat-box" style="font-size: 12px; opacity: 0.75;">
          <span>Fuel: 100% (Placeholder)</span>
        </div>
      </div>

      <!-- Center Interaction Prompt Card -->
      <div id="hud-interaction-prompt" class="interaction-prompt hidden">
        <span class="key-badge">E</span>
        <span id="prompt-text">Interact with Merchant</span>
      </div>
    `;

    parent.appendChild(this.container);

    this.promptCard = (this.container.querySelector('#hud-interaction-prompt') || document.createElement('div')) as HTMLDivElement;
    this.cashDisplay = (this.container.querySelector('#hud-cash') || document.createElement('span')) as HTMLSpanElement;
    this.repDisplay = (this.container.querySelector('#hud-rep') || document.createElement('span')) as HTMLSpanElement;
    this.stateBadge = (this.container.querySelector('#hud-state-badge') || document.createElement('span')) as HTMLSpanElement;
    this.staminaBar = (this.container.querySelector('#hud-stamina-bar') || document.createElement('div')) as HTMLDivElement;

    this.drivingWidget = (this.container.querySelector('#hud-driving-widget') || document.createElement('div')) as HTMLDivElement;
    this.kphDisplay = (this.container.querySelector('#hud-kph') || document.createElement('span')) as HTMLSpanElement;
    this.drivingStateBadge = (this.container.querySelector('#hud-driving-state') || document.createElement('span')) as HTMLSpanElement;
  }

  public updatePlayerStats(cash: number, rep: number, mode: PlayerStateMode, stamina: number): void {
    if (this.cashDisplay) this.cashDisplay.textContent = `KSh ${cash.toLocaleString()}`;
    if (this.repDisplay) this.repDisplay.textContent = `⭐ ${rep}`;

    if (this.stateBadge) {
      this.stateBadge.textContent = mode;
      this.stateBadge.className = `badge state-${mode.toLowerCase()}`;
    }

    if (this.staminaBar && this.staminaBar.style) {
      this.staminaBar.style.width = `${Math.max(0, Math.min(100, stamina))}%`;
    }
  }

  public updateDrivingHUD(speedKph: number, modeState: string, isDriving: boolean): void {
    if (this.drivingWidget && this.drivingWidget.classList) {
      if (isDriving) {
        this.drivingWidget.classList.remove('hidden');
        if (this.kphDisplay) this.kphDisplay.textContent = `${Math.round(speedKph)} KPH`;
        if (this.drivingStateBadge) this.drivingStateBadge.textContent = modeState;
      } else {
        this.drivingWidget.classList.add('hidden');
      }
    }
  }

  public updateInteractionPrompt(promptState: InteractionPromptState): void {
    if (this.promptCard && this.promptCard.classList) {
      if (promptState.hasTarget && promptState.target) {
        this.promptCard.classList.remove('hidden');
        const textSpan = this.promptCard.querySelector('#prompt-text');
        if (textSpan) {
          textSpan.textContent = `Interact with ${promptState.displayName} (${promptState.distanceMeters}m)`;
        }
      } else {
        this.promptCard.classList.add('hidden');
      }
    }
  }
}
