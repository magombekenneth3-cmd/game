import { VehicleStateMode } from './VehicleTypes';

export class VehicleStateManager {
  private modeState: VehicleStateMode = 'PARKED';
  private onStateChangeCallback?: (mode: VehicleStateMode) => void;

  public setState(newMode: VehicleStateMode): void {
    if (this.modeState !== newMode) {
      this.modeState = newMode;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(newMode);
      }
    }
  }

  public getState(): VehicleStateMode {
    return this.modeState;
  }

  public setOnStateChange(callback: (mode: VehicleStateMode) => void): void {
    this.onStateChangeCallback = callback;
  }
}
