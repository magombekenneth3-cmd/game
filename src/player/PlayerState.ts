import { PlayerStateMode } from './PlayerTypes';

export class PlayerState {
  private mode: PlayerStateMode = 'IDLE';
  private cash: number = 2500; // Starting cash (KSh)
  private reputation: number = 10;
  private health: number = 100;
  private stamina: number = 100;
  private maxStamina: number = 100;
  private onStateChangeCallback?: (mode: PlayerStateMode) => void;

  public setMode(newMode: PlayerStateMode): void {
    if (this.mode !== newMode) {
      this.mode = newMode;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(newMode);
      }
    }
  }

  public getMode(): PlayerStateMode {
    return this.mode;
  }

  public updateStamina(deltaSeconds: number, isSprinting: boolean): void {
    if (isSprinting && this.mode === 'SPRINTING') {
      this.stamina = Math.max(0, this.stamina - 20 * deltaSeconds);
      if (this.stamina === 0) {
        // Exhausted, drop down to running
        this.setMode('RUNNING');
      }
    } else {
      // Regenerate stamina
      this.stamina = Math.min(this.maxStamina, this.stamina + 15 * deltaSeconds);
    }
  }

  public setOnStateChange(callback: (mode: PlayerStateMode) => void): void {
    this.onStateChangeCallback = callback;
  }

  public getCash(): number {
    return this.cash;
  }

  public addCash(amount: number): void {
    this.cash += amount;
  }

  public getReputation(): number {
    return this.reputation;
  }

  public addReputation(amount: number): void {
    this.reputation += amount;
  }

  public getHealth(): number {
    return this.health;
  }

  public getStamina(): number {
    return this.stamina;
  }
}
