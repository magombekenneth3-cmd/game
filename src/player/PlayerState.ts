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

  public deductCash(amount: number): boolean {
    if (this.cash >= amount) {
      this.cash -= amount;
      return true;
    }
    return false;
  }

  // --- M-PESA Mobile Money Wallet ---
  private mpesaBalance: number = 10000; // Starting M-PESA account balance (KSh)

  public getMpesaBalance(): number {
    return this.mpesaBalance;
  }

  public depositToMpesa(amount: number): boolean {
    if (amount <= 0 || this.cash < amount) return false;
    this.cash -= amount;
    this.mpesaBalance += amount;
    return true;
  }

  public withdrawFromMpesa(amount: number, fee: number = 0): boolean {
    const totalRequired = amount + fee;
    if (amount <= 0 || this.mpesaBalance < totalRequired) return false;
    this.mpesaBalance -= totalRequired;
    this.cash += amount;
    return true;
  }

  public deductMpesa(amount: number): boolean {
    if (amount <= 0 || this.mpesaBalance < amount) return false;
    this.mpesaBalance -= amount;
    return true;
  }

  public addMpesa(amount: number): void {
    if (amount > 0) {
      this.mpesaBalance += amount;
    }
  }

  public consumeFood(healthRestore: number, staminaRestore: number): void {
    this.health = Math.min(100, this.health + healthRestore);
    this.stamina = Math.min(this.maxStamina, this.stamina + staminaRestore);
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
