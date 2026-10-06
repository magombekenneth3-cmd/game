export interface IVehicleInputState {
  throttle: number; // 0.0 to 1.0
  reverse: number;  // 0.0 to 1.0
  steer: number;    // -1.0 (left) to 1.0 (right)
  handbrake: boolean;
  exitVehicle: boolean;
}

export class VehicleInput {
  private inputState: IVehicleInputState = {
    throttle: 0,
    reverse: 0,
    steer: 0,
    handbrake: false,
    exitVehicle: false
  };

  public setInput(throttle: number, reverse: number, steer: number, handbrake: boolean, exitVehicle: boolean): void {
    this.inputState = { throttle, reverse, steer, handbrake, exitVehicle };
  }

  public getInput(): IVehicleInputState {
    return { ...this.inputState };
  }
}
