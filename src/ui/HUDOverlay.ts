import { PlayerStateMode } from '../player/PlayerTypes';
import { InteractionPromptState } from '../player/InteractionSystem';
import { MatatuShiftSession } from '../traffic/MatatuOperatorTypes';

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

  // Matatu Operator HUD Widget
  private operatorWidget: HTMLDivElement;
  private operatorSaccoBadge: HTMLSpanElement;
  private operatorRouteCode: HTMLSpanElement;
  private operatorNextStage: HTMLSpanElement;
  private operatorSeats: HTMLSpanElement;
  private operatorEarnings: HTMLSpanElement;
  private operatorSatisfaction: HTMLSpanElement;
  private operatorRushBadge: HTMLSpanElement;
  private operatorInstruction: HTMLDivElement;

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

      <!-- Matatu Operator Shift Dashboard Widget -->
      <div id="hud-matatu-operator-widget" class="hud-matatu-operator-widget hidden" style="position: absolute; top: 25px; right: 380px; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(12px); padding: 14px 20px; border-radius: 12px; border: 2px solid #facc15; box-shadow: 0 8px 32px rgba(0,0,0,0.45); color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; gap: 8px; min-width: 290px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="operator-sacco-badge" style="background: #0f2042; border: 1px solid #facc15; color: #facc15; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">SUPER METRO</span>
            <span id="operator-route-code" style="font-size: 12px; font-weight: 700; color: #94a3b8;">ROUTE 105</span>
          </div>
          <span id="operator-rush-badge" style="background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">🔥 RUSH HOUR (1.4x)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600;">
          <span style="color: #cbd5e1;">Next Stop:</span>
          <span id="operator-next-stage" style="color: #38bdf8; font-weight: 700;">GPO Stage (42m)</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 8px;">
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Seats</div>
            <div id="operator-seats" style="font-size: 13px; font-weight: 800; color: #e2e8f0;">0 / 14</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Fares</div>
            <div id="operator-earnings" style="font-size: 13px; font-weight: 800; color: #4ade80;">KES 0</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Vibe</div>
            <div id="operator-satisfaction" style="font-size: 13px; font-weight: 800; color: #facc15;">⭐ 100%</div>
          </div>
        </div>
        <div id="operator-instruction" style="font-size: 11px; color: #facc15; font-weight: 600; text-align: center; background: rgba(250, 204, 21, 0.1); padding: 4px; border-radius: 4px;">
          [T] Makanga Tout | [Space] Open Doors & Board
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

    this.operatorWidget = (this.container.querySelector('#hud-matatu-operator-widget') || document.createElement('div')) as HTMLDivElement;
    this.operatorSaccoBadge = (this.container.querySelector('#operator-sacco-badge') || document.createElement('span')) as HTMLSpanElement;
    this.operatorRouteCode = (this.container.querySelector('#operator-route-code') || document.createElement('span')) as HTMLSpanElement;
    this.operatorNextStage = (this.container.querySelector('#operator-next-stage') || document.createElement('span')) as HTMLSpanElement;
    this.operatorSeats = (this.container.querySelector('#operator-seats') || document.createElement('span')) as HTMLSpanElement;
    this.operatorEarnings = (this.container.querySelector('#operator-earnings') || document.createElement('span')) as HTMLSpanElement;
    this.operatorSatisfaction = (this.container.querySelector('#operator-satisfaction') || document.createElement('span')) as HTMLSpanElement;
    this.operatorRushBadge = (this.container.querySelector('#operator-rush-badge') || document.createElement('span')) as HTMLSpanElement;
    this.operatorInstruction = (this.container.querySelector('#operator-instruction') || document.createElement('div')) as HTMLDivElement;
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

  public updateMatatuOperatorHUD(session: MatatuShiftSession | undefined): void {
    if (!this.operatorWidget || !this.operatorWidget.classList) return;

    if (!session) {
      this.operatorWidget.classList.add('hidden');
      return;
    }

    this.operatorWidget.classList.remove('hidden');

    if (this.operatorSaccoBadge) {
      this.operatorSaccoBadge.textContent = session.saccoId.replace('_', ' ').toUpperCase();
    }
    if (this.operatorRouteCode) {
      this.operatorRouteCode.textContent = session.routeCode;
    }
    if (this.operatorNextStage) {
      const dist = Math.round(session.distanceToTargetCurbMeters);
      this.operatorNextStage.textContent = `${session.targetStageName} (${dist}m)`;
    }
    if (this.operatorSeats) {
      this.operatorSeats.textContent = `${session.passengers.length} / ${session.maxSeats}`;
    }
    if (this.operatorEarnings) {
      const total = session.earnings.grossFaresKES + session.earnings.tipsEarnedKES;
      this.operatorEarnings.textContent = `KES ${total.toLocaleString()}`;
    }
    if (this.operatorSatisfaction) {
      this.operatorSatisfaction.textContent = `⭐ ${Math.round(session.telemetry.satisfactionScore)}%`;
    }
    if (this.operatorRushBadge) {
      if (session.isPeakRushHour) {
        this.operatorRushBadge.style.display = 'inline-block';
        this.operatorRushBadge.textContent = `🔥 RUSH HOUR (${session.rushHourMultiplier}x)`;
      } else {
        this.operatorRushBadge.style.display = 'none';
      }
    }
    if (this.operatorInstruction) {
      if (session.dockedAtStage) {
        this.operatorInstruction.textContent = `[T] Makanga: Tout Passengers | [W] Depart Stage`;
      } else if (session.distanceToTargetCurbMeters <= 6.0) {
        this.operatorInstruction.textContent = `[Space] Stop & Open Doors to Board`;
      } else {
        this.operatorInstruction.textContent = `[T] Makanga Callout | [H] Horn | Pull in at next bay`;
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
