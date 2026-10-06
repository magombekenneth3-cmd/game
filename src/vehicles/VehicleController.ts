import { Vehicle } from './Vehicle';
import { VehicleInput } from './VehicleInput';

export class VehicleController {
  private activeVehicle?: Vehicle;
  private input: VehicleInput = new VehicleInput();

  public setActiveVehicle(vehicle?: Vehicle): void {
    if (this.activeVehicle) {
      this.activeVehicle.state.modeState = 'UNOCCUPIED';
    }
    this.activeVehicle = vehicle;
    if (this.activeVehicle) {
      this.activeVehicle.state.modeState = 'DRIVING';
      this.activeVehicle.state.occupiedSeats = 1;
    }
  }

  public getActiveVehicle(): Vehicle | undefined {
    return this.activeVehicle;
  }

  public updateDrivingInput(w: boolean, s: boolean, a: boolean, d: boolean, handbrake: boolean, exit: boolean): void {
    if (!this.activeVehicle) return;

    let throttle = 0;
    let reverse = 0;
    let steer = 0;

    if (w) throttle = 1.0;
    if (s) reverse = 1.0;
    if (a) steer = -1.0;
    if (d) steer = 1.0;

    this.input.setInput(throttle, reverse, steer, handbrake, exit);

    this.activeVehicle.state.throttle = throttle > 0 ? throttle : -reverse;
    this.activeVehicle.state.steering = steer;
    this.activeVehicle.state.handbrake = handbrake;
  }
}
